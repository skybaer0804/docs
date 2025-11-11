import { readdir, stat } from 'fs/promises';
import { join, extname, relative } from 'path';
import { writeFileSync } from 'fs';

async function getAllFiles(dir, baseDir = dir) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            const subFiles = await getAllFiles(fullPath, baseDir);
            files.push(...subFiles);
        } else if (entry.isFile() && (extname(entry.name) === '.md' || extname(entry.name) === '.template')) {
            const relativePath = '/docs/' + relative(baseDir, fullPath).replace(/\\/g, '/');
            files.push({
                path: relativePath,
                name: entry.name,
                category: relativePath.split('/').length > 3 ? relativePath.split('/')[2] : 'root',
            });
        }
    }

    return files;
}

async function generateDocsList() {
    const docsDir = join(process.cwd(), 'docs');
    const rootFiles = [
        { path: '/README.md', name: 'README.md', category: 'root' },
        { path: '/SETUP.md', name: 'SETUP.md', category: 'root' },
    ];

    try {
        const docsFiles = await getAllFiles(docsDir);
        const allFiles = [...rootFiles, ...docsFiles];

        const categorized = {};
        allFiles.forEach((file) => {
            if (!categorized[file.category]) {
                categorized[file.category] = [];
            }
            const route = file.path.replace(/\.(md|template)$/, '');
            const title = file.name.replace(/\.(md|template)$/, '');
            categorized[file.category].push({
                path: file.path,
                route,
                title,
                category: file.category,
            });
        });

        const output = {
            files: allFiles.map((f) => ({
                path: f.path,
                route: f.path.replace(/\.(md|template)$/, ''),
                title: f.name.replace(/\.(md|template)$/, ''),
                category: f.category,
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
