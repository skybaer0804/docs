const supabase = require('../config/supabase');

function isDocsPath(path) {
  return typeof path === 'string' && path.startsWith('/docs');
}

function normalizePath(path) {
  if (typeof path !== 'string') return '';
  // 중복 슬래시 제거 (단, 프로토콜 같은 건 없으니 단순 처리)
  return path.replace(/\/{2,}/g, '/');
}

function splitNameForAutoRename(name) {
  if (typeof name !== 'string') return { base: '', ext: '' };
  const lastDot = name.lastIndexOf('.');
  if (lastDot <= 0) return { base: name, ext: '' };
  return { base: name.slice(0, lastDot), ext: name.slice(lastDot) };
}

async function ensureDocsRootDirectory(author_id) {
  // /docs 루트 노드가 없는 DB(마이그레이션/초기 데이터)에서도 move 대상이 될 수 있어 보강
  const { data: existing } = await supabase.from('nodes').select('id, type, path').eq('path', '/docs').single();
  if (existing && existing.type === 'DIRECTORY') return existing;

  // 없으면 생성 (동시 생성 시 UNIQUE(path) 충돌 가능 → 재조회로 복구)
  const insertData = {
    parent_id: null,
    type: 'DIRECTORY',
    name: 'docs',
    content: null,
    path: '/docs',
    is_public: true,
    author_id,
  };

  const { data, error } = await supabase.from('nodes').insert([insertData]).select('id, type, path').single();
  if (!error && data) return data;

  // 이미 생겼거나 기타 에러면 재조회 시도
  const { data: reFetched, error: refetchErr } = await supabase
    .from('nodes')
    .select('id, type, path')
    .eq('path', '/docs')
    .single();
  if (refetchErr) throw error || refetchErr;
  if (reFetched.type !== 'DIRECTORY') throw new Error('Invalid /docs root node type');
  return reFetched;
}

async function getUniqueNameInParent({ parentId, desiredName, excludeId }) {
  const { base, ext } = splitNameForAutoRename(desiredName);
  let candidate = desiredName;

  // 충돌 시 " (1)"..." (n)" 부여
  for (let i = 0; i < 100; i++) {
    const { data, error } = await supabase
      .from('nodes')
      .select('id')
      .eq('parent_id', parentId)
      .eq('name', candidate)
      .limit(1);

    if (error) throw error;
    const hit = Array.isArray(data) ? data[0] : null;

    if (!hit) return candidate;
    if (excludeId && hit.id === excludeId) return candidate;

    candidate = `${base} (${i + 1})${ext}`;
  }

  throw new Error('Failed to generate unique name');
}

// 전체 문서 구조 조회 (내 문서만 반환하도록 변경)
exports.getAllDocs = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json([]); // 로그인 안했으면 빈 배열 (또는 public만 반환하도록 기획에 따라 조정 가능)
    }

    const { data, error } = await supabase
      .from('nodes')
      .select('id, parent_id, name, type, path, visibility_type, author_id')
      .eq('author_id', userId)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 통합 문서 검색 (내 문서 + 선택적으로 구독 유저 문서)
exports.searchDocs = async (req, res) => {
  try {
    const { q, include_following } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    const keyword = q.trim();
    let query;

    if (include_following === 'true') {
      // 1. 내가 팔로잉하는 유저 ID 목록 가져오기
      const { data: subs } = await supabase.from('subscriptions').select('following_id').eq('follower_id', userId);

      const followingIds = subs?.map((s) => s.following_id) || [];

      // 2. 통합 검색 쿼리 (내 문서 전체 + 팔로잉 유저의 공개/구독자 전용 문서)
      let filterStr = `author_id.eq.${userId}`;
      if (followingIds.length > 0) {
        filterStr += `,and(author_id.in.(${followingIds.join(',')}),visibility_type.in.(public,subscriber_only))`;
      }

      query = supabase
        .from('nodes')
        .select(
          `
          id, name, path, type, visibility_type, author_id,
          users:author_id (username)
        `,
        )
        .or(filterStr)
        .ilike('name', `%${keyword}%`)
        .order('type', { ascending: true })
        .limit(50);
    } else {
      // 내 문서만 검색
      query = supabase
        .from('nodes')
        .select(
          `
          id, name, path, type, visibility_type, author_id,
          users:author_id (username)
        `,
        )
        .eq('author_id', userId)
        .ilike('name', `%${keyword}%`)
        .order('type', { ascending: true })
        .limit(50);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('searchDocs error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 특정 유저의 문서 구조 조회 (가시성 필터링 적용)
exports.getUserDocs = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user?.id;

    let allowedVisibilities = ['public'];

    // 구독 여부 확인
    if (viewerId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('follower_id', viewerId)
        .eq('following_id', userId)
        .single();

      if (subscription) {
        allowedVisibilities.push('subscriber_only');
      }

      // 본인인 경우 (이 API를 본인이 쓸 일은 적겠지만 처리)
      if (viewerId === userId) {
        allowedVisibilities.push('subscriber_only', 'private');
      }
    }

    const { data, error } = await supabase
      .from('nodes')
      .select('id, parent_id, name, type, path, visibility_type, author_id')
      .eq('author_id', userId)
      .in('visibility_type', allowedVisibilities)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 특정 문서 조회 (ID 기반)
exports.getDocById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: doc, error } = await supabase.from('nodes').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Document not found' });
      throw error;
    }

    // 권한 체크: 비공개 문서는 로그인 유저(본인)만 볼 수 있음
    if (doc.visibility_type === 'private' && (!req.user || req.user.id !== doc.author_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 구독자 전용 문서 체크
    if (doc.visibility_type === 'subscriber_only' && (!req.user || req.user.id !== doc.author_id)) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('follower_id', req.user?.id)
        .eq('following_id', doc.author_id)
        .single();

      if (!sub) {
        return res.status(403).json({ error: 'Access denied. Subscriber only.' });
      }
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 특정 문서 조회 (path 기반) - DEPRECATED: ID 기반 조회를 권장합니다.
exports.getDocByPath = async (req, res) => {
  try {
    const pathParam = req.params[0]; // wildcard capture
    const fullPath = `/${pathParam}`;

    const { data: doc, error } = await supabase.from('nodes').select('*').eq('path', fullPath).single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Document not found' });
      throw error;
    }

    // 권한 체크: 비공개 문서는 로그인 유저(본인)만 볼 수 있음
    if (doc.visibility_type === 'private' && (!req.user || req.user.id !== doc.author_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 구독자 전용 문서 체크
    if (doc.visibility_type === 'subscriber_only' && (!req.user || req.user.id !== doc.author_id)) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('follower_id', req.user?.id)
        .eq('following_id', doc.author_id)
        .single();

      if (!sub) {
        return res.status(403).json({ error: 'Access denied. Subscriber only.' });
      }
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 문서/폴더 생성
exports.createDoc = async (req, res) => {
  try {
    const { type, parent_id: req_parent_id, parent_path, name, content, visibility_type } = req.body;

    // author_id 필수 체크
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    // 1. 부모 ID 결정
    let parent_id = req_parent_id || null;

    // 하위 호환성: parent_id가 없고 parent_path가 있는 경우에만 path로 검색
    if (!parent_id && parent_path && parent_path !== '/' && parent_path !== '/docs') {
      const { data: parent } = await supabase.from('nodes').select('id').eq('path', parent_path).single();
      if (parent) {
        parent_id = parent.id;
      }
    }

    // 2. 전체 경로 생성 (하위 호환성을 위해 유지하되, 선택적으로 처리)
    let newPath = null;
    if (parent_path) {
      const cleanParentPath = parent_path === '/' ? '' : parent_path;
      newPath = `${cleanParentPath}/${name}`;
    } else if (parent_id) {
      // parent_id만 있는 경우 path 기반 로직이 깨질 수 있으므로,
      // 프론트엔드 전환 전까지는 가급적 path를 유지하는 것이 안전함.
      // 하지만 1번 과제의 취지에 따라 path 의존성을 줄여야 함.
      const { data: parent } = await supabase.from('nodes').select('path').eq('id', parent_id).single();
      if (parent) {
        newPath = `${parent.path}/${name}`;
      }
    } else {
      newPath = `/docs/${name}`;
    }

    // 3. DB 저장
    const insertData = {
      parent_id,
      type,
      name,
      content: type === 'FILE' ? content : null,
      path: newPath, // TODO: DB 스키마에서 path 제거 후 삭제 예정
      visibility_type: visibility_type || 'public',
      author_id: author_id,
    };

    const { data, error } = await supabase.from('nodes').insert([insertData]).select().single();

    if (error) {
      console.error('createDoc: Supabase insert error:', error);
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 파일 업로드 (.md 파일)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // author_id 필수 체크
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    const { parent_path, is_public } = req.body;
    const content = req.file.buffer.toString('utf8');
    const originalName = req.file.originalname;
    const name = originalName.replace(/\.md$/i, ''); // 확장자 제거

    // 로직 재사용을 위해 내부적으로 처리하거나 복붙
    // 여기선 복붙 형태로 간결하게
    let parent_id = null;
    if (parent_path && parent_path !== '/' && parent_path !== '/docs') {
      const { data: parent } = await supabase.from('nodes').select('id').eq('path', parent_path).single();

      if (!parent) return res.status(404).json({ error: 'Parent directory not found' });
      parent_id = parent.id;
    }

    const cleanParentPath = parent_path === '/' ? '' : parent_path || '';
    const newPath = `${cleanParentPath}/${name}`;

    const { data, error } = await supabase
      .from('nodes')
      .insert([
        {
          parent_id,
          type: 'FILE',
          name,
          content,
          path: newPath,
          is_public: is_public !== undefined ? is_public : true,
          author_id, // 필수 필드 추가
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 문서 수정
exports.updateDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, visibility_type, name } = req.body;

    // author_id 필수 체크
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    // 권한 체크: 자신이 생성한 노드만 수정 가능
    const { data: existingNode } = await supabase.from('nodes').select('author_id').eq('id', id).single();

    if (!existingNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    if (existingNode.author_id !== author_id) {
      return res.status(403).json({ error: 'Permission denied. You can only update your own nodes.' });
    }

    const updates = { updated_at: new Date() };
    if (content !== undefined) updates.content = content;
    if (visibility_type !== undefined) updates.visibility_type = visibility_type;
    if (name !== undefined) updates.name = name;
    // 이름 변경 시 path 업데이트 로직 필요 (복잡하므로 일단 생략하거나 추후 구현)

    const { data, error } = await supabase.from('nodes').update(updates).eq('id', id).select().single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 삭제 (CASCADE: 하위 노드도 함께 삭제)
exports.deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;

    // author_id 필수 체크
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    // 권한 체크: 자신이 생성한 노드만 삭제 가능
    const { data: node } = await supabase.from('nodes').select('author_id, path, type').eq('id', id).single();

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    if (node.author_id !== author_id) {
      return res.status(403).json({ error: 'Permission denied. You can only delete your own nodes.' });
    }

    // CASCADE 삭제: 하위 노드들도 함께 삭제
    // 재귀적으로 모든 하위 노드 찾기
    const deleteRecursive = async (nodeId) => {
      // 현재 노드의 모든 하위 노드 찾기
      const { data: children } = await supabase.from('nodes').select('id').eq('parent_id', nodeId);

      if (children && children.length > 0) {
        // 각 하위 노드에 대해 재귀적으로 삭제
        for (const child of children) {
          await deleteRecursive(child.id);
        }
      }

      // 현재 노드 삭제
      const { error } = await supabase.from('nodes').delete().eq('id', nodeId);
      if (error) throw error;
    };

    await deleteRecursive(id);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 문서/폴더 이동
// body: { id: UUID, target_parent_path: "/docs/Some/Dir" }
exports.moveDoc = async (req, res) => {
  try {
    const { id, target_parent_id } = req.body || {};

    // auth
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    if (!id) {
      return res.status(400).json({ error: 'Missing required field: id' });
    }

    // source node
    const { data: source, error: sourceErr } = await supabase
      .from('nodes')
      .select('id, parent_id, name, type, path, author_id')
      .eq('id', id)
      .single();

    if (sourceErr) {
      if (sourceErr.code === 'PGRST116') return res.status(404).json({ error: 'Node not found' });
      throw sourceErr;
    }

    if (source.author_id !== author_id) {
      return res.status(403).json({ error: 'Permission denied. You can only move your own nodes.' });
    }

    // target_parent_id가 null이면 루트로 이동
    let targetParentId = target_parent_id === null || target_parent_id === 'null' ? null : target_parent_id;

    // target_parent_id가 제공된 경우, 해당 노드가 DIRECTORY인지 확인
    if (targetParentId) {
      const { data: targetParent, error: targetErr } = await supabase
        .from('nodes')
        .select('id, type')
        .eq('id', targetParentId)
        .single();

      if (targetErr) {
        if (targetErr.code === 'PGRST116') {
          return res.status(404).json({ error: 'Target parent directory not found' });
        }
        throw targetErr;
      }

      if (!targetParent || targetParent.type !== 'DIRECTORY') {
        return res.status(400).json({ error: 'Drop target must be a directory.' });
      }

      // prevent cycles (dir -> its descendant)
      if (source.type === 'DIRECTORY' && source.id === targetParentId) {
        return res.status(400).json({ error: 'Cannot move a directory into itself.' });
      }
    }

    // no-op: same parent
    if (source.parent_id === targetParentId) {
      return res.json({
        id: source.id,
        parent_id: source.parent_id,
        noop: true,
      });
    }

    // update source: parent_id만 업데이트
    const { data: updated, error: updateErr } = await supabase
      .from('nodes')
      .update({
        parent_id: targetParentId,
      })
      .eq('id', source.id)
      .select('id, parent_id, name, type, path, author_id')
      .single();

    if (updateErr) throw updateErr;

    res.json({
      id: updated.id,
      parent_id: updated.parent_id,
    });
  } catch (err) {
    console.error('moveDoc error:', {
      message: err?.message,
      stack: err?.stack,
      body: req?.body,
      userId: req?.user?.id,
    });
    res.status(500).json({ error: err.message });
  }
};
