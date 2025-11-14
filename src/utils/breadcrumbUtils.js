/**
 * 브레드크럼 아이템 클릭 핸들러
 * SPA 구조: onNavigate prop을 통한 네비게이션
 */
export const handleBreadcrumbClick = (item, onNavigate) => {
    if (item.route && onNavigate) {
        onNavigate(item.route);
    } else if (onNavigate) {
        // 카테고리/서브카테고리 클릭 시 해당 폴더 뷰로 이동
        if (item.type === 'category') {
            const categoryRoute = `/category/${item.category}`;
            onNavigate(categoryRoute);
        } else if (item.type === 'subcategory') {
            const subcategoryRoute = `/category/${item.category}/${item.subcategory}`;
            onNavigate(subcategoryRoute);
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
            label: 'Home',
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
            label: 'Home',
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
 * 모바일용 브레드크럼 아이템 필터링
 * 파일명은 온전히 표시하고, 중간 경로만 ...으로 줄임
 * 예: 홈 > ... > works > filename
 */
export const filterBreadcrumbItemsForMobile = (items) => {
    const totalItems = items.length;

    // 3개 이하면 모두 표시
    if (totalItems <= 3) {
        return items.map((item, index) => ({ item, index, isEllipsis: false }));
    }

    // 첫 번째(홈), 마지막(파일명)은 항상 표시
    // 마지막에서 두 번째(파일이 있는 디렉토리)도 표시
    // 중간 경로들은 ...으로 대체
    const result = [
        { item: items[0], index: 0, isEllipsis: false }, // 홈
    ];

    // 중간에 경로가 있으면 ... 추가
    if (totalItems > 3) {
        result.push({ item: null, index: -1, isEllipsis: true });
    }

    // 마지막에서 두 번째 (파일이 있는 디렉토리)
    if (totalItems > 2) {
        result.push({ item: items[totalItems - 2], index: totalItems - 2, isEllipsis: false });
    }

    // 마지막 (파일명)
    result.push({ item: items[totalItems - 1], index: totalItems - 1, isEllipsis: false });

    return result;
};
