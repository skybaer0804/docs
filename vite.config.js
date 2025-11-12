import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 문서 목록 생성 플러그인
function generateDocsPlugin() {
    return {
        name: 'generate-docs',
        buildStart() {
            // 빌드 시작 시 문서 목록 생성
            execAsync('node scripts/generate-docs-list.js').catch((err) => {
                console.error('Error generating docs list:', err);
            });
        },
        configureServer(server) {
            // 개발 서버 시작 시 문서 목록 생성
            execAsync('node scripts/generate-docs-list.js').catch((err) => {
                console.error('Error generating docs list:', err);
            });

            // public/docs 디렉토리 변경 감지
            server.watcher.add('public/docs/**/*');
            server.watcher.on('change', (path) => {
                if (path.includes('public/docs')) {
                    console.log('📝 Docs changed, regenerating docs list...');
                    execAsync('node scripts/generate-docs-list.js').catch((err) => {
                        console.error('Error generating docs list:', err);
                    });
                }
            });
            server.watcher.on('add', (path) => {
                if (path.includes('public/docs')) {
                    console.log('📝 New doc added, regenerating docs list...');
                    execAsync('node scripts/generate-docs-list.js').catch((err) => {
                        console.error('Error generating docs list:', err);
                    });
                }
            });
            server.watcher.on('unlink', (path) => {
                if (path.includes('public/docs')) {
                    console.log('📝 Doc removed, regenerating docs list...');
                    execAsync('node scripts/generate-docs-list.js').catch((err) => {
                        console.error('Error generating docs list:', err);
                    });
                }
            });
        },
    };
}

export default defineConfig({
    plugins: [preact(), generateDocsPlugin()],
    server: {
        port: 8888,
        open: true,
    },
});
