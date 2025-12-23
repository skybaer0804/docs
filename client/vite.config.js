import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
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

            // 마크다운 파일 요청 시 UTF-8 인코딩 헤더 추가
            server.middlewares.use((req, res, next) => {
                // 마크다운 파일 요청인 경우 UTF-8 인코딩 헤더 추가
                if (req.url && (req.url.endsWith('.md') || req.url.endsWith('.template'))) {
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                }
                next();
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
    define: {
        'import.meta.env.VITE_NODE_MODE': JSON.stringify(process.env.NODE_MODE || process.env.NODE_ENV || 'development'),
    },
    plugins: [
        preact(),
        generateDocsPlugin(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.svg', 'icon.svg'],
            manifest: {
                name: 'Nodnjs Documentation',
                short_name: 'Docs',
                description: 'Nodnjs 프로젝트 문서',
                theme_color: '#0066cc',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/assets/icon-192x192.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'any maskable',
                    },
                    {
                        src: '/assets/icon-512x512.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,md,template}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
        }),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ['legacy-js-api'],
            },
        },
    },
    server: {
        port: 8888,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
