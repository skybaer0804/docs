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
            // path가 있으면 사용 (directoryPath 기반)
            const categoryRoute = item.path ? `/category/${item.path}` : `/category/${item.category}`;
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
        // path가 있으면 사용 (directoryPath 기반)
        if (item.path) {
            return `/category/${item.path}`;
        }
        return `/category/${item.category}`;
    }
    if (item.type === 'subcategory') {
        return `/category/${item.category}/${item.subcategory}`;
    }
    return item.route;
};

/**
 * 카테고리 경로에서 브레드크럼 아이템 생성
 * pathParts 배열을 사용하여 모든 경로 세그먼트를 표시
 * 하위 호환성을 위해 category, subcategory도 지원
 */
export const buildCategoryBreadcrumbItems = (pathParts, category = null, subcategory = null) => {
    const items = [
        {
            label: 'Home',
            route: '/',
            type: 'link',
            level: 0,
        },
    ];

    // pathParts 배열이 있으면 모든 경로 세그먼트 추가 (우선)
    if (pathParts && Array.isArray(pathParts) && pathParts.length > 0) {
        let currentPath = '';
        pathParts.forEach((dir, index) => {
            if (index === 0) {
                currentPath = dir;
            } else {
                currentPath = `${currentPath}/${dir}`;
            }

            items.push({
                label: dir,
                route: null,
                type: 'category',
                category: dir,
                path: currentPath,
                level: index + 1,
            });
        });
    } else {
        // 하위 호환성: category, subcategory 사용
        if (category) {
            items.push({
                label: category,
                route: null,
                type: 'category',
                category: category,
                level: 1,
            });
        }

        if (subcategory) {
            items.push({
                label: subcategory,
                route: null,
                type: 'subcategory',
                category: category,
                subcategory: subcategory,
                level: 2,
            });
        }
    }

    return items;
};

/**
 * 파일 경로에서 브레드크럼 아이템 생성
 * directoryPath를 사용하여 모든 경로 세그먼트를 표시
 */
export const buildFileBreadcrumbItems = (file) => {
    const items = [
        {
            label: 'Home',
            route: '/',
            type: 'link',
            level: 0,
        },
    ];

    // directoryPath가 있으면 모든 경로 세그먼트 추가
    if (file.directoryPath && Array.isArray(file.directoryPath) && file.directoryPath.length > 0) {
        // 각 경로 세그먼트를 순차적으로 추가
        let currentPath = '';
        file.directoryPath.forEach((dir, index) => {
            if (index === 0) {
                currentPath = dir;
            } else {
                currentPath = `${currentPath}/${dir}`;
            }

            items.push({
                label: dir,
                route: null,
                type: 'category',
                category: dir,
                path: currentPath,
                level: index + 1, // 들여쓰기 레벨 (1부터 시작)
            });
        });
    } else {
        // directoryPath가 없으면 기존 방식 사용 (하위 호환성)
        // 카테고리 추가
        if (file.category && file.category !== 'root') {
            items.push({
                label: file.category,
                route: null,
                type: 'category',
                category: file.category,
                level: 1,
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
                level: 2,
            });
        }
    }

    // 현재 파일 추가
    items.push({
        label: file.title,
        route: null,
        type: 'current',
        level: file.directoryPath ? file.directoryPath.length + 1 : items.length,
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
