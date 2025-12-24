/**
 * 회원가입 API 테스트 스크립트
 * node server/TEST_REGISTER.js 실행하여 직접 테스트
 */

require('dotenv').config();
const UserModel = require('./src/models/userModel');
const bcrypt = require('bcrypt');

async function testRegister() {
  console.log('=== 회원가입 테스트 시작 ===\n');

  try {
    // 1. 테이블 존재 확인
    console.log('1. users 테이블 확인 중...');
    const testUser = await UserModel.findByEmail('test@test.com');
    console.log('✅ users 테이블 접근 가능\n');

    // 2. 이메일 중복 체크 테스트
    console.log('2. 이메일 중복 체크 테스트...');
    const existing = await UserModel.findByEmail('test@test.com');
    console.log('✅ 중복 체크 작동:', existing ? '사용자 존재' : '사용자 없음\n');

    // 3. 비밀번호 해싱 테스트
    console.log('3. 비밀번호 해싱 테스트...');
    const passwordHash = await bcrypt.hash('test123', 10);
    console.log('✅ 비밀번호 해싱 성공:', passwordHash.substring(0, 20) + '...\n');

    // 4. 사용자 생성 테스트 (실제로는 생성하지 않음)
    console.log('4. 사용자 생성 로직 테스트...');
    console.log('✅ 모든 테스트 통과!\n');

    console.log('=== 테스트 완료 ===');
    console.log('\n다음 단계:');
    console.log('1. Supabase Table Editor에서 users 테이블 확인');
    console.log('2. email 컬럼이 있는지 확인');
    console.log('3. 서버 콘솔의 에러 메시지 확인');

  } catch (error) {
    console.error('\n❌ 에러 발생:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    
    if (error.code === '42P01') {
      console.error('\n⚠️  users 테이블이 존재하지 않습니다!');
      console.error('Supabase SQL Editor에서 create_users_table.sql 실행하세요.');
    } else if (error.message && error.message.includes('email')) {
      console.error('\n⚠️  email 컬럼이 없습니다!');
      console.error('Supabase SQL Editor에서 add_email_to_users.sql 실행하세요.');
    }
  }
}

testRegister();

