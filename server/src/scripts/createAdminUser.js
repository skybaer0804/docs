/**
 * 초기 관리자 계정 생성 스크립트
 * 사용법: node src/scripts/createAdminUser.js <email> <password>
 * 예: node src/scripts/createAdminUser.js admin@example.com admin123
 */

const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');
require('dotenv').config();

async function createAdminUser() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node src/scripts/createAdminUser.js <email> <password>');
    process.exit(1);
  }

  try {
    // 기존 사용자 확인
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      console.error(`User with email ${email} already exists`);
      process.exit(1);
    }

    // 비밀번호 해싱
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const user = await UserModel.create(email, passwordHash);

    console.log('Admin user created successfully:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Created at: ${user.created_at}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();

