/**
 * 서버 라우트 확인 스크립트
 * node server/CHECK_ROUTES.js 실행하여 라우트가 제대로 등록되었는지 확인
 */

const app = require('./src/app');

console.log('=== 등록된 라우트 확인 ===\n');

// Express 앱의 라우터 스택 확인
function printRoutes(stack, prefix = '') {
  stack.forEach((middleware) => {
    if (middleware.route) {
      // 직접 등록된 라우트
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      console.log(`${methods.padEnd(10)} ${prefix}${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // 라우터 미들웨어
      const routerPrefix = middleware.regexp.source
        .replace('\\/?', '')
        .replace('(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace(/\^/g, '')
        .replace(/\$/g, '')
        .replace(/\\/g, '');
      
      if (middleware.handle && middleware.handle.stack) {
        printRoutes(middleware.handle.stack, routerPrefix);
      }
    }
  });
}

if (app._router && app._router.stack) {
  printRoutes(app._router.stack);
} else {
  console.log('라우트를 찾을 수 없습니다.');
}

console.log('\n=== 확인 완료 ===');
console.log('\n/api/auth/register 라우트가 보여야 합니다.');

