const supabase = require('../config/supabase');

// 전체 문서 구조 조회
exports.getAllDocs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('nodes')
      .select('id, parent_id, name, type, path, is_public')
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
    let query = supabase
      .from('nodes')
      .select('*')
      .eq('path', fullPath)
      .single();

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
    
    // 1. 부모 ID 찾기 (Root인 경우 parent_path가 없거나 '/'일 수 있음)
    let parent_id = null;
    if (parent_path && parent_path !== '/') {
      const { data: parent } = await supabase
        .from('nodes')
        .select('id')
        .eq('path', parent_path)
        .single();
      
      if (!parent) return res.status(404).json({ error: 'Parent directory not found' });
      parent_id = parent.id;
    }

    // 2. 전체 경로 생성
    const cleanParentPath = parent_path === '/' ? '' : (parent_path || '');
    const newPath = `${cleanParentPath}/${name}`;

    // 3. DB 저장
    const { data, error } = await supabase
      .from('nodes')
      .insert([
        {
          parent_id,
          type,
          name,
          content: type === 'FILE' ? content : null,
          path: newPath,
          is_public: is_public !== undefined ? is_public : true
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 파일 업로드 (.md 파일)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const { parent_path, is_public } = req.body;
    const content = req.file.buffer.toString('utf8');
    const originalName = req.file.originalname;
    const name = originalName.replace(/\.md$/i, ''); // 확장자 제거

    // 로직 재사용을 위해 내부적으로 처리하거나 복붙
    // 여기선 복붙 형태로 간결하게
    let parent_id = null;
    if (parent_path && parent_path !== '/') {
      const { data: parent } = await supabase
        .from('nodes')
        .select('id')
        .eq('path', parent_path)
        .single();
      
      if (!parent) return res.status(404).json({ error: 'Parent directory not found' });
      parent_id = parent.id;
    }

    const cleanParentPath = parent_path === '/' ? '' : (parent_path || '');
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
          is_public: is_public !== undefined ? is_public : true
        }
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

    const updates = { updated_at: new Date() };
    if (content !== undefined) updates.content = content;
    if (is_public !== undefined) updates.is_public = is_public;
    if (name !== undefined) updates.name = name;
    // 이름 변경 시 path 업데이트 로직 필요 (복잡하므로 일단 생략하거나 추후 구현)

    const { data, error } = await supabase
      .from('nodes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 삭제
exports.deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('nodes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

