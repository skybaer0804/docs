import { route } from 'preact-router';
import { getMarkdownFiles } from '../utils/markdownLoader';
import { useSidebar } from '../contexts/SidebarContext';

export function Breadcrumb({ currentRoute, onNavigate }) {
    const sidebar = useSidebar();
    const onToggleSidebar = sidebar?.toggleSidebar;
    const categoryNames = {
        root: '루트',
        common: '공통',
        sdk: 'SDK',
        backend: '백엔드',
        misc: '기타',
    };

    // handleClick 함수를 먼저 정의
    const handleClick = (item) => {
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

    const { files, categorized } = getMarkdownFiles();

    // 홈일 때도 브레드크럼 표시
    if (!currentRoute || currentRoute === '/') {
        return (
            <div class="breadcrumb-container sticky-breadcrumb">
                <div class="breadcrumb-header">
                    <h4 class="breadcrumb-title">Nodnjs Documentation</h4>
                    {onToggleSidebar && (
                        <button class="mobile-menu-toggle-small" onClick={onToggleSidebar} aria-label="메뉴 토글">
                            ☰
                        </button>
                    )}
                </div>
                {/* 데스크톱 브레드크럼 */}
                <nav class="breadcrumb desktop-breadcrumb">
                    <span class="breadcrumb-item">
                        <span class="breadcrumb-current">홈</span>
                    </span>
                </nav>

                {/* 모바일 브레드크럼 */}
                <nav class="breadcrumb mobile-breadcrumb">
                    <span class="breadcrumb-item">
                        <span class="breadcrumb-current">홈</span>
                    </span>
                </nav>
            </div>
        );
    }

    // 카테고리/서브카테고리 경로인 경우
    if (currentRoute.startsWith('/category/')) {
        const parts = currentRoute.replace('/category/', '').split('/');
        const category = parts[0];
        const subcategory = parts[1];
        const breadcrumbItems = [];

        breadcrumbItems.push({
            label: '홈',
            route: '/',
            type: 'link',
        });

        if (category) {
            breadcrumbItems.push({
                label: categoryNames[category] || category,
                route: null,
                type: 'category',
                category: category,
            });
        }

        if (subcategory) {
            breadcrumbItems.push({
                label: subcategory,
                route: null,
                type: 'subcategory',
                category: category,
                subcategory: subcategory,
            });
        }

        return (
            <div class="breadcrumb-container sticky-breadcrumb">
                <div class="breadcrumb-header">
                    <h4 class="breadcrumb-title">Nodnjs Documentation</h4>
                    {onToggleSidebar && (
                        <button class="mobile-menu-toggle-small" onClick={onToggleSidebar} aria-label="메뉴 토글">
                            ☰
                        </button>
                    )}
                </div>
                {/* 데스크톱 브레드크럼 */}
                <nav class="breadcrumb desktop-breadcrumb">
                    {breadcrumbItems.map((item, index) => {
                        const isCurrent = index === breadcrumbItems.length - 1;
                        const linkRoute =
                            item.type === 'category'
                                ? `/category/${item.category}`
                                : item.type === 'subcategory'
                                ? `/category/${item.category}/${item.subcategory}`
                                : item.route;

                        return (
                            <span key={index} class="breadcrumb-item">
                                {!isCurrent && linkRoute ? (
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleClick(item);
                                        }}
                                        class="breadcrumb-link"
                                    >
                                        {item.label}
                                    </a>
                                ) : (
                                    <span class="breadcrumb-current">{item.label}</span>
                                )}
                                {index < breadcrumbItems.length - 1 && <span class="breadcrumb-separator"> &gt; </span>}
                            </span>
                        );
                    })}
                </nav>

                {/* 모바일 브레드크럼 */}
                <nav class="breadcrumb sticky-breadcrumb mobile-breadcrumb">
                    {(() => {
                        // 경로가 4개 이하면 모두 표시, 그 이상이면 생략
                        const maxItems = 4;
                        const totalItems = breadcrumbItems.length;
                        let displayItems = [];

                        if (totalItems <= maxItems) {
                            // 모두 표시
                            displayItems = breadcrumbItems.map((item, index) => ({ item, index, isEllipsis: false }));
                        } else {
                            // 첫 번째, 마지막 2개, 중간에 ... 표시
                            displayItems = [
                                { item: breadcrumbItems[0], index: 0, isEllipsis: false },
                                { item: null, index: -1, isEllipsis: true },
                                { item: breadcrumbItems[totalItems - 2], index: totalItems - 2, isEllipsis: false },
                                { item: breadcrumbItems[totalItems - 1], index: totalItems - 1, isEllipsis: false },
                            ];
                        }

                        return displayItems.map(({ item, index, isEllipsis }, displayIndex) => {
                            if (isEllipsis) {
                                return (
                                    <span key="ellipsis" class="breadcrumb-separator">
                                        ...
                                    </span>
                                );
                            }

                            const isCurrent = index === breadcrumbItems.length - 1;
                            const linkRoute =
                                item.type === 'category'
                                    ? `/category/${item.category}`
                                    : item.type === 'subcategory'
                                    ? `/category/${item.category}/${item.subcategory}`
                                    : item.route;
                            const isLastDisplayItem = displayIndex === displayItems.length - 1;

                            return (
                                <span key={index} class="breadcrumb-item">
                                    {!isCurrent && linkRoute ? (
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleClick(item);
                                            }}
                                            class="breadcrumb-link"
                                        >
                                            {item.label}
                                        </a>
                                    ) : (
                                        <span class="breadcrumb-current">{item.label}</span>
                                    )}
                                    {!isLastDisplayItem && <span class="breadcrumb-separator"> &gt; </span>}
                                </span>
                            );
                        });
                    })()}
                </nav>
            </div>
        );
    }

    const file = files.find((f) => f.route === currentRoute);

    if (!file) {
        return null;
    }

    const breadcrumbItems = [];

    // 홈 추가
    breadcrumbItems.push({
        label: '홈',
        route: '/',
        type: 'link',
    });

    // 카테고리 추가
    if (file.category && file.category !== 'root') {
        breadcrumbItems.push({
            label: categoryNames[file.category] || file.category,
            route: null,
            type: 'category',
            category: file.category,
        });
    }

    // 서브카테고리 추가
    if (file.subcategory) {
        breadcrumbItems.push({
            label: file.subcategory,
            route: null,
            type: 'subcategory',
            category: file.category,
            subcategory: file.subcategory,
        });
    }

    // 현재 파일 추가
    breadcrumbItems.push({
        label: file.title,
        route: null,
        type: 'current',
    });

    return (
        <div class="breadcrumb-container sticky-breadcrumb">
            <div class="breadcrumb-header">
                <h4 class="breadcrumb-title">Nodnjs Documentation</h4>
                {onToggleSidebar && (
                    <button class="mobile-menu-toggle-small" onClick={onToggleSidebar} aria-label="메뉴 토글">
                        ☰
                    </button>
                )}
            </div>
            {/* 데스크톱 브레드크럼 */}
            <nav class="breadcrumb desktop-breadcrumb">
                {breadcrumbItems.map((item, index) => {
                    // 모든 항목을 링크로 표시 (현재 파일 제외)
                    const isCurrent = item.type === 'current';
                    const linkRoute =
                        item.type === 'category'
                            ? `/category/${item.category}`
                            : item.type === 'subcategory'
                            ? `/category/${item.category}/${item.subcategory}`
                            : item.route;

                    return (
                        <span key={index} class="breadcrumb-item">
                            {!isCurrent && linkRoute ? (
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleClick(item);
                                    }}
                                    class="breadcrumb-link"
                                >
                                    {item.label}
                                </a>
                            ) : (
                                <span class="breadcrumb-current">{item.label}</span>
                            )}
                            {index < breadcrumbItems.length - 1 && <span class="breadcrumb-separator"> &gt; </span>}
                        </span>
                    );
                })}
            </nav>

            {/* 모바일 브레드크럼 */}
            <nav class="breadcrumb sticky-breadcrumb mobile-breadcrumb">
                {(() => {
                    // 경로가 4개 이하면 모두 표시, 그 이상이면 생략
                    const maxItems = 4;
                    const totalItems = breadcrumbItems.length;
                    let displayItems = [];

                    if (totalItems <= maxItems) {
                        // 모두 표시
                        displayItems = breadcrumbItems.map((item, index) => ({ item, index, isEllipsis: false }));
                    } else {
                        // 첫 번째, 마지막 2개, 중간에 ... 표시
                        displayItems = [
                            { item: breadcrumbItems[0], index: 0, isEllipsis: false },
                            { item: null, index: -1, isEllipsis: true },
                            { item: breadcrumbItems[totalItems - 2], index: totalItems - 2, isEllipsis: false },
                            { item: breadcrumbItems[totalItems - 1], index: totalItems - 1, isEllipsis: false },
                        ];
                    }

                    return displayItems.map(({ item, index, isEllipsis }, displayIndex) => {
                        if (isEllipsis) {
                            return (
                                <span key="ellipsis" class="breadcrumb-separator">
                                    ...
                                </span>
                            );
                        }

                        const isCurrent = item.type === 'current';
                        const linkRoute =
                            item.type === 'category'
                                ? `/category/${item.category}`
                                : item.type === 'subcategory'
                                ? `/category/${item.category}/${item.subcategory}`
                                : item.route;
                        const isLastDisplayItem = displayIndex === displayItems.length - 1;

                        return (
                            <span key={index} class="breadcrumb-item">
                                {!isCurrent && linkRoute ? (
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleClick(item);
                                        }}
                                        class="breadcrumb-link"
                                    >
                                        {item.label}
                                    </a>
                                ) : (
                                    <span class="breadcrumb-current">{item.label}</span>
                                )}
                                {!isLastDisplayItem && <span class="breadcrumb-separator"> &gt; </span>}
                            </span>
                        );
                    });
                })()}
            </nav>
        </div>
    );
}
