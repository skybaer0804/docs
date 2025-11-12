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
            files.push({
                path: relativePath,
                name: entry.name,
                category: pathParts.length > 2 ? pathParts[1] : 'root',
                subcategory: pathParts.length > 3 ? pathParts[2] : null,
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

        // 디렉토리 구조로 재구성
        const tree = {};
        allFiles.forEach((file) => {
            // route는 path와 동일하게 확장자 포함
            const route = file.path;
            const title = file.name.replace(/\.(md|template)$/, '');
            const fileInfo = {
                path: file.path,
                route,
                title,
                category: file.category,
                subcategory: file.subcategory,
                ext: file.ext,
            };

            if (!tree[file.category]) {
                tree[file.category] = {};
            }

            if (file.subcategory) {
                if (!tree[file.category][file.subcategory]) {
                    tree[file.category][file.subcategory] = [];
                }
                tree[file.category][file.subcategory].push(fileInfo);
            } else {
                if (!tree[file.category]._files) {
                    tree[file.category]._files = [];
                }
                tree[file.category]._files.push(fileInfo);
            }
        });

        const categorized = {};
        Object.keys(tree).forEach((category) => {
            categorized[category] = tree[category];
        });

        const output = {
            files: allFiles.map((f) => ({
                path: f.path,
                route: f.path, // route는 path와 동일하게 확장자 포함
                title: f.name.replace(/\.(md|template)$/, ''),
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
