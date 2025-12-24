import { useState, useEffect, useMemo } from 'preact/hooks';
import { fetchAllDocs } from '../utils/api';
import { buildCategoryBreadcrumbItems, buildFileBreadcrumbItems } from '../utils/breadcrumbUtils';
import { devError } from '../utils/logger';

/**
 * Breadcrumb의 로직을 담당하는 Custom Hook
 * TDD 친화적: 로직을 분리하여 테스트 용이
 */
export function useBreadcrumb(currentRoute) {
    const [allFiles, setAllFiles] = useState([]);

    useEffect(() => {
        async function loadData() {
            try {
                const nodes = await fetchAllDocs();
                // 파일 노드들만 추출 및 변환
                const files = nodes
                    .filter((n) => n.type === 'FILE')
                    .map((n) => {
                        const parts = n.path.split('/').filter(Boolean);
                        // parts: ['docs', 'Platform', 'Web', 'guide']
                        let directoryPath = [];
                        if (parts[0] === 'docs') {
                            directoryPath = parts.slice(1, -1);
                        } else {
                            directoryPath = parts.slice(0, -1);
                        }
                        
                        return {
                            path: n.path,
                            route: n.path,
                            title: n.name.replace(/\.md$/, ''),
                            name: n.name,
                            directoryPath: directoryPath
                        };
                    });
                setAllFiles(files);
            } catch (error) {
                devError('Error loading docs for breadcrumb:', error);
            }
        }
        loadData();
    }, []);

    return useMemo(() => {
        // 홈일 때도 브레드크럼 표시
        if (!currentRoute || currentRoute === '/') {
            const homeItems = [{ label: 'Home', route: '/', type: 'link' }];
            return {
                items: homeItems,
                displayType: 'home',
            };
        }

        // 카테고리/서브카테고리 경로인 경우
        if (currentRoute.startsWith('/category/')) {
            // 무제한 중첩 경로 파싱
            const pathParts = currentRoute
                .replace('/category/', '')
                .split('/')
                .filter((p) => p); // 빈 문자열 제거

            const breadcrumbItems = buildCategoryBreadcrumbItems(pathParts);

            return {
                items: breadcrumbItems,
                displayType: 'category',
            };
        }

        const file = allFiles.find((f) => f.route === currentRoute);

        if (!file) {
            return {
                items: [],
                displayType: 'none',
            };
        }

        const breadcrumbItems = buildFileBreadcrumbItems(file);

        return {
            items: breadcrumbItems,
            displayType: 'file',
        };
    }, [currentRoute, allFiles]);
}
