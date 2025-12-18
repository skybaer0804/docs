import { useState, useMemo, useEffect } from 'preact/hooks';
import { getMarkdownFiles } from '../utils/markdownLoader';

/**
 * 검색 로직을 담당하는 Custom Hook
 * @param {string} query 검색어
 * @returns {Object} 검색 결과 { results: Array }
 */
export function useSearch(query) {
    const [allFiles, setAllFiles] = useState([]);
    const [allDirectories, setAllDirectories] = useState([]);

    // 초기 데이터 로드 및 디렉토리 목록 추출
    useEffect(() => {
        const { files } = getMarkdownFiles();
        setAllFiles(files);

        // 파일 목록에서 유니크한 디렉토리 경로 추출
        const directories = new Set();
        const dirObjects = [];

        files.forEach(file => {
            if (file.directoryPath && Array.isArray(file.directoryPath)) {
                let currentPath = '';
                file.directoryPath.forEach((dir, index) => {
                    // 경로 생성
                    const prevPath = currentPath;
                    currentPath = index === 0 ? dir : `${currentPath}/${dir}`;
                    
                    if (!directories.has(currentPath)) {
                        directories.add(currentPath);
                        dirObjects.push({
                            title: dir,
                            path: currentPath,
                            route: `/category/${currentPath}`, // 디렉토리 클릭 시 이동할 라우트
                            type: 'directory',
                            depth: index
                        });
                    }
                });
            }
        });

        // 깊이순 정렬 (상위 디렉토리가 먼저 나오도록 하거나, 가나다순)
        dirObjects.sort((a, b) => a.path.localeCompare(b.path));
        setAllDirectories(dirObjects);
    }, []);

    // 검색어에 따른 필터링
    const results = useMemo(() => {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const lowerQuery = query.toLowerCase();

        // 1. 디렉토리 검색
        const matchedDirs = allDirectories.filter(dir => 
            dir.title.toLowerCase().includes(lowerQuery) || 
            dir.path.toLowerCase().includes(lowerQuery)
        ).map(dir => ({ ...dir, type: 'directory' }));

        // 2. 파일 검색
        const matchedFiles = allFiles.filter(file => 
            file.title.toLowerCase().includes(lowerQuery)
        ).map(file => ({ ...file, type: 'file' }));

        // 결과 병합: 디렉토리 우선 표시
        return [...matchedDirs, ...matchedFiles];
    }, [query, allFiles, allDirectories]);

    return { results };
}






