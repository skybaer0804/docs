import { readdir, stat } from 'fs/promises';
import { join, extname, relative } from 'path';
import { writeFileSync } from 'fs';

async function getAllFiles(dir, baseDir = dir, pathPrefix = '') {
    const files = [];
    const dirs = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            const dirPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;
            dirs.push({
                name: entry.name,
                path: dirPath,
                fullPath: fullPath,
            });
        } else if (entry.isFile() && (extname(entry.name) === '.md' || extname(entry.name) === '.template')) {
            const relativePath = '/docs/' + relative(baseDir, fullPath).replace(/\\/g, '/');
            const pathParts = relativePath.split('/').filter((p) => p);
            // 무제한 중첩 구조 지원: 전체 경로를 배열로 저장
            const directoryPath = pathParts.slice(1, -1); // 'docs' 제외하고 파일명 제외
            files.push({
                path: relativePath,
                name: entry.name,
                directoryPath: directoryPath, // 전체 디렉토리 경로 배열
                category: directoryPath.length > 0 ? directoryPath[0] : 'root',
                subcategory: directoryPath.length > 1 ? directoryPath[1] : null,
                ext: extname(entry.name),
            });
        }
    }

    // 하위 디렉토리 처리
    for (const dirInfo of dirs) {
        const subFiles = await getAllFiles(dirInfo.fullPath, baseDir, dirInfo.path);
        files.push(...subFiles);
    }

    return files;
}

async function generateDocsList() {
    const docsDir = join(process.cwd(), 'public', 'docs');

    try {
        const docsFiles = await getAllFiles(docsDir);
        const allFiles = docsFiles;

        // 무제한 중첩 디렉토리 구조로 재구성
        function buildTree(files) {
            const tree = {};

            files.forEach((file) => {
                const route = file.path;
                const title = file.name.replace(/\.(md|template)$/, '');
                const fileInfo = {
                    path: file.path,
                    route,
                    title,
                    directoryPath: file.directoryPath || [],
                    category: file.category,
                    subcategory: file.subcategory,
                    ext: file.ext,
                };

                // 디렉토리 경로를 따라 트리 구조 생성
                let current = tree;
                const dirPath = file.directoryPath || [];

                for (let i = 0; i < dirPath.length; i++) {
                    const dirName = dirPath[i];
                    if (!current[dirName]) {
                        current[dirName] = {};
                    }
                    current = current[dirName];
                }

                // 파일을 _files 배열에 추가
                if (!current._files) {
                    current._files = [];
                }
                current._files.push(fileInfo);
            });

            return tree;
        }

        const categorized = buildTree(allFiles);

        const output = {
            files: allFiles.map((f) => ({
                path: f.path,
                route: f.path, // route는 path와 동일하게 확장자 포함
                title: f.name.replace(/\.(md|template)$/, ''),
                directoryPath: f.directoryPath || [],
                category: f.category,
                subcategory: f.subcategory,
                ext: f.ext || '',
            })),
            categorized,
        };

        writeFileSync(join(process.cwd(), 'src', 'docs-list.json'), JSON.stringify(output, null, 2), 'utf-8');

        console.log(`Generated docs list with ${allFiles.length} files`);
    } catch (error) {
        console.error('Error generating docs list:', error);
        process.exit(1);
    }
}

generateDocsList();
