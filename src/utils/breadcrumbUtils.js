import { route } from 'preact-router';

/**
 * 브레드크럼 아이템 클릭 핸들러
 */
export const handleBreadcrumbClick = (item, onNavigate) => {
    if (item.route && onNavigate) {
        onNavigate(item.route);
    } else if (item.route) {
        route(item.route);
    } else {
        // 카테고리/서브카테고리 클릭 시 해당 폴더 뷰로 이동
        if (item.type === 'category') {
            const categoryRoute = `/category/${item.category}`;
            if (onNavigate) {
                onNavigate(categoryRoute);
            } else {
                route(categoryRoute);
            }
        } else if (item.type === 'subcategory') {
            const subcategoryRoute = `/category/${item.category}/${item.subcategory}`;
            if (onNavigate) {
                onNavigate(subcategoryRoute);
            } else {
                route(subcategoryRoute);
            }
        }
    }
};

/**
 * 브레드크럼 아이템의 링크 경로를 생성
 */
export const getBreadcrumbLinkRoute = (item) => {
    if (item.type === 'category') {
        return `/category/${item.category}`;
    }
    if (item.type === 'subcategory') {
        return `/category/${item.category}/${item.subcategory}`;
    }
    return item.route;
};

/**
 * 카테고리 경로에서 브레드크럼 아이템 생성
 */
export const buildCategoryBreadcrumbItems = (category, subcategory) => {
    const items = [
        {
            label: '홈',
            route: '/',
            type: 'link',
        },
    ];

    if (category) {
        items.push({
            label: category,
            route: null,
            type: 'category',
            category: category,
        });
    }

    if (subcategory) {
        items.push({
            label: subcategory,
            route: null,
            type: 'subcategory',
            category: category,
            subcategory: subcategory,
        });
    }

    return items;
};

/**
 * 파일 경로에서 브레드크럼 아이템 생성
 */
export const buildFileBreadcrumbItems = (file) => {
    const items = [
        {
            label: '홈',
            route: '/',
            type: 'link',
        },
    ];

    // 카테고리 추가
    if (file.category && file.category !== 'root') {
        items.push({
            label: file.category,
            route: null,
            type: 'category',
            category: file.category,
        });
    }

    // 서브카테고리 추가
    if (file.subcategory) {
        items.push({
            label: file.subcategory,
            route: null,
            type: 'subcategory',
            category: file.category,
            subcategory: file.subcategory,
        });
    }

    // 현재 파일 추가
    items.push({
        label: file.title,
        route: null,
        type: 'current',
    });

    return items;
};

/**
 * 모바일용 브레드크럼 아이템 필터링 (최대 4개)
 */
export const filterBreadcrumbItemsForMobile = (items, maxItems = 4) => {
    const totalItems = items.length;

    if (totalItems <= maxItems) {
        return items.map((item, index) => ({ item, index, isEllipsis: false }));
    }

    // 첫 번째, 마지막 2개, 중간에 ... 표시
    return [
        { item: items[0], index: 0, isEllipsis: false },
        { item: null, index: -1, isEllipsis: true },
        { item: items[totalItems - 2], index: totalItems - 2, isEllipsis: false },
        { item: items[totalItems - 1], index: totalItems - 1, isEllipsis: false },
    ];
};
