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
        const homeItems = [{ label: '홈', route: '/', type: 'link' }];
        return {
            items: homeItems,
            displayType: 'home',
        };
    }

    // 카테고리/서브카테고리 경로인 경우
    if (currentRoute.startsWith('/category/')) {
        const parts = currentRoute.replace('/category/', '').split('/');
        const category = parts[0];
        const subcategory = parts[1];
        const breadcrumbItems = buildCategoryBreadcrumbItems(category, subcategory);

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
