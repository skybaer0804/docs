import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const dirsToClean = ['dist', join('node_modules', '.vite')];

console.log('🧹 캐시 정리 중...');

dirsToClean.forEach((dir) => {
    if (existsSync(dir)) {
        try {
            rmSync(dir, { recursive: true, force: true });
            console.log(`✅ ${dir} 삭제 완료`);
        } catch (error) {
            console.error(`❌ ${dir} 삭제 실패:`, error.message);
        }
    } else {
        console.log(`ℹ️  ${dir} 없음 (건너뜀)`);
    }
});

console.log('✨ 캐시 정리 완료!');
