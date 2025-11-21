import { getMarkdownFiles } from '../utils/markdownLoader';
import { buildCategoryBreadcrumbItems, buildFileBreadcrumbItems } from '../utils/breadcrumbUtils';

/**
 * Breadcrumb의 로직을 담당하는 Custom Hook
 * TDD 친화적: 로직을 분리하여 테스트 용이
 */
export function useBreadcrumb(currentRoute) {
    const { files } = getMarkdownFiles();

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

    const file = files.find((f) => f.route === currentRoute);

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
}
