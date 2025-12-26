const supabase = require('../config/supabase');

/**
 * 사용자 모델
 * Supabase PostgreSQL의 users 테이블과 상호작용
 */
class UserModel {
  /**
   * 이메일로 사용자 조회
   * @param {string} email
   * @returns {Promise<Object|null>} 사용자 객체 또는 null
   */
  static async findByEmail(email) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  /**
   * 사용자 ID로 조회
   * @param {string} id
   * @returns {Promise<Object|null>} 사용자 객체 또는 null
   */
  static async findById(id) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * 새 사용자 생성 (관리자용, 초기 설정)
   * @param {string} username
   * @param {string} email
   * @param {string} passwordHash
   * @returns {Promise<Object>} 생성된 사용자 객체
   */
  static async create(username, email, passwordHash) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          password_hash: passwordHash,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('UserModel.create error:', error);
      throw error;
    }
    return data;
  }

  /**
   * 사용자 프로필 업데이트
   * @param {string} id
   * @param {Object} updates - 업데이트할 필드들 (document_title, personal_link)
   * @returns {Promise<Object>} 업데이트된 사용자 객체
   */
  static async updateProfile(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('UserModel.updateProfile error:', error);
      throw error;
    }
    return data;
  }

  /**
   * 사용자 검색 (username 또는 document_title)
   * @param {string} query - 검색어
   * @param {string} excludeId - 검색 결과에서 제외할 ID (본인)
   */
  static async search(query, excludeId) {
    let q = supabase
      .from('users')
      .select('id, username, document_title, personal_link')
      .or(`username.ilike.%${query}%,document_title.ilike.%${query}%`)
      .limit(20);

    if (excludeId) {
      q = q.neq('id', excludeId);
    }

    const { data, error } = await q;

    if (error) {
      console.error('UserModel.search error:', error);
      throw error;
    }
    return data;
  }
}

module.exports = UserModel;
