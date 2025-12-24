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

// 전체 문서 구조 조회
exports.getAllDocs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('nodes')
      .select('id, parent_id, name, type, path, is_public, author_id')
      .order('type', { ascending: false }) // 폴더 먼저, 그 다음 파일
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 특정 문서 조회 (path 기반)
exports.getDocByPath = async (req, res) => {
  try {
    const pathParam = req.params[0]; // wildcard capture
    const fullPath = `/${pathParam}`;

    // 로그인 여부 확인 (미들웨어에서 req.user 설정 가정)
    // 비로그인 상태면 is_public 체크
    let query = supabase.from('nodes').select('*').eq('path', fullPath).single();

    const { data: doc, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Document not found' });
      throw error;
    }

    // 권한 체크: 비공개 문서는 로그인 유저만 볼 수 있음
    // TODO: 실제 인증 미들웨어 연동 시 주석 해제
    // if (!doc.is_public && !req.user) {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 문서/폴더 생성
exports.createDoc = async (req, res) => {
  try {
    const { type, parent_path, name, content, is_public } = req.body;

    // author_id 필수 체크
    if (!req.user || !req.user.id) {
      console.error('createDoc: req.user is missing or has no id', { user: req.user });
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    // author_id가 유효한지 확인
    if (!author_id || author_id === null || author_id === undefined) {
      console.error('createDoc: author_id is invalid', { author_id, user: req.user });
      return res.status(401).json({ error: 'Invalid user ID. Please login again.' });
    }

    // 1. 부모 ID 찾기 (Root인 경우 parent_path가 없거나 '/'일 수 있음)
    let parent_id = null;
    if (parent_path && parent_path !== '/') {
      const { data: parent } = await supabase.from('nodes').select('id').eq('path', parent_path).single();

      if (!parent) return res.status(404).json({ error: 'Parent directory not found' });
      parent_id = parent.id;
    }

    // 2. 전체 경로 생성
    const cleanParentPath = parent_path === '/' ? '' : parent_path || '';
    const newPath = `${cleanParentPath}/${name}`;

    // 3. DB 저장
    const insertData = {
      parent_id,
      type,
      name,
      content: type === 'FILE' ? content : null,
      path: newPath,
      is_public: is_public !== undefined ? is_public : true,
      author_id: author_id, // 필수 필드 추가 (명시적으로 설정)
    };

    // 디버깅: author_id 확인
    console.log('createDoc: Inserting node with author_id:', {
      author_id,
      author_id_type: typeof author_id,
      user_id: req.user.id,
      type,
      name,
      path: newPath,
    });

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
    if (parent_path && parent_path !== '/') {
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
    const { content, is_public, name } = req.body;

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
    if (is_public !== undefined) updates.is_public = is_public;
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
    const { id, target_parent_path } = req.body || {};

    // auth
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. User ID is missing.' });
    }
    const author_id = req.user.id;

    if (!id) {
      return res.status(400).json({ error: 'Missing required field: id' });
    }
    if (!target_parent_path || typeof target_parent_path !== 'string') {
      return res.status(400).json({ error: 'Missing required field: target_parent_path' });
    }

    const targetParentPath = normalizePath(target_parent_path);
    if (!isDocsPath(targetParentPath)) {
      return res.status(400).json({ error: 'Invalid target parent path. Must be under /docs.' });
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

    if (!isDocsPath(source.path)) {
      return res.status(400).json({ error: 'Only nodes under /docs can be moved.' });
    }
    if (source.path === '/docs') {
      return res.status(400).json({ error: 'The /docs root cannot be moved.' });
    }

    // target parent node
    const { data: targetParent, error: targetErr } = await supabase
      .from('nodes')
      .select('id, type, path')
      .eq('path', targetParentPath)
      .single();

    if (targetErr) {
      if (targetErr.code === 'PGRST116') return res.status(404).json({ error: 'Target parent directory not found' });
      throw targetErr;
    }
    if (targetParent.type !== 'DIRECTORY') {
      return res.status(400).json({ error: 'Drop target must be a directory.' });
    }

    // prevent cycles (dir -> its descendant)
    if (source.type === 'DIRECTORY') {
      const oldPrefix = normalizePath(source.path);
      const targetPrefix = normalizePath(targetParent.path);
      if (targetPrefix === oldPrefix || targetPrefix.startsWith(`${oldPrefix}/`)) {
        return res.status(400).json({ error: 'Cannot move a directory into itself or its descendants.' });
      }
    }

    // no-op: same parent + same name
    if (source.parent_id === targetParent.id) {
      const sameParentPath = normalizePath(targetParent.path);
      const expectedPath = normalizePath(`${sameParentPath}/${source.name}`);
      if (expectedPath === normalizePath(source.path)) {
        return res.json({
          id: source.id,
          oldPath: source.path,
          newPath: source.path,
          name: source.name,
          renamed: false,
          noop: true,
        });
      }
    }

    const uniqueName = await getUniqueNameInParent({
      parentId: targetParent.id,
      desiredName: source.name,
      excludeId: source.id,
    });

    const oldPath = normalizePath(source.path);
    const newPath = normalizePath(`${targetParent.path}/${uniqueName}`);

    // descendants snapshot (before updating source path)
    let descendants = [];
    if (source.type === 'DIRECTORY') {
      const { data: children, error: childrenErr } = await supabase
        .from('nodes')
        .select('id, path')
        .like('path', `${oldPath}/%`);
      if (childrenErr) throw childrenErr;
      descendants = Array.isArray(children) ? children : [];
    }

    // update source
    const { data: updated, error: updateErr } = await supabase
      .from('nodes')
      .update({
        parent_id: targetParent.id,
        name: uniqueName,
        path: newPath,
      })
      .eq('id', source.id)
      .select('id, parent_id, name, type, path, author_id')
      .single();

    if (updateErr) throw updateErr;

    // update descendants paths (keep parent_id chain intact, only rewrite prefix)
    if (descendants.length > 0) {
      for (const child of descendants) {
        const childPath = normalizePath(child.path);
        if (!childPath.startsWith(`${oldPath}/`)) continue;
        const suffix = childPath.slice(oldPath.length);
        const rewritten = normalizePath(`${newPath}${suffix}`);

        const { error: childUpdateErr } = await supabase.from('nodes').update({ path: rewritten }).eq('id', child.id);
        if (childUpdateErr) throw childUpdateErr;
      }
    }

    res.json({
      id: updated.id,
      oldPath,
      newPath: updated.path,
      name: updated.name,
      renamed: updated.name !== source.name,
      movedType: updated.type,
      descendantCount: descendants.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
