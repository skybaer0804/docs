import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { getMarkdownContent, getMarkdownFiles } from '../utils/markdownLoader';
import { MarkdownViewer } from '../components/MarkdownViewer';
import { TemplateViewer } from '../components/TemplateViewer';
import { DirectoryView } from '../components/DirectoryView';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { route } from 'preact-router';
import { devLog, devWarn } from '../utils/logger';
import './DocPage.scss';

export function DocPage({ url }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [fileExt, setFileExt] = useState('');
    const [currentRoute, setCurrentRoute] = useState('');
    const [currentFile, setCurrentFile] = useState(null);
    const touchStartRef = useRef(null);
    const touchEndRef = useRef(null);
    const [slideDirection, setSlideDirection] = useState('none'); // 'left', 'right', 'none'
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);

    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            const routePath = url || '/';

            // 모바일에서 페이지 전환 애니메이션
            if (window.innerWidth <= 768 && currentRoute && currentRoute !== routePath && !isSwiping) {
                // 이전 경로와 비교하여 방향 결정
                const prevDepth = currentRoute.split('/').filter((p) => p).length;
                const newDepth = routePath.split('/').filter((p) => p).length;

                if (newDepth > prevDepth) {
                    // 하위로 이동 (우→좌 슬라이드 인)
                    setSlideDirection('left');
                    setTimeout(() => setSlideDirection('none'), 350);
                } else if (newDepth < prevDepth) {
                    // 상위로 이동 (좌→우 슬라이드 아웃) - 일반 클릭 시에는 즉시 전환
                    setSlideDirection('none');
                } else {
                    setSlideDirection('none');
                }
            } else if (!isSwiping) {
                setSlideDirection('none');
            }

            setCurrentRoute(routePath);

            // 카테고리/서브카테고리 경로인 경우 파일을 로드하지 않음
            if (routePath.startsWith('/category/')) {
                setContent('');
                setCurrentFile(null);
                setLoading(false);
                return;
            }

            const { files } = getMarkdownFiles();
            // route로 파일 찾기 (확장자 포함)
            let file = files.find((f) => f.route === routePath);

            // 찾지 못한 경우 확장자 없는 경로로도 시도 (하위 호환성)
            if (!file) {
                const routePathWithExt = routePath + '.md';
                file = files.find((f) => f.route === routePathWithExt);
            }
            if (!file) {
                const routePathWithTemplate = routePath + '.template';
                file = files.find((f) => f.route === routePathWithTemplate);
            }

            if (routePath.toLowerCase().includes('readme')) {
                devLog(`[DEBUG] DocPage - routePath: ${routePath}`);
                devLog(`[DEBUG] DocPage - 파일 찾기 결과:`, file ? file.path : '없음');
                if (file) {
                    devLog(`[DEBUG] DocPage - 파일 정보:`, {
                        path: file.path,
                        route: file.route,
                        title: file.title,
                        ext: file.ext,
                    });
                }
            }

            if (file) {
                setCurrentFile(file);
                setFileExt(file.ext || '');
                const mdContent = await getMarkdownContent(file.path);
                if (mdContent) {
                    if (file.path.toLowerCase().includes('readme')) {
                        devLog(`[DEBUG] DocPage - 콘텐츠 로드 성공, 길이: ${mdContent.length}`);
                        devLog(`[DEBUG] DocPage - 콘텐츠 첫 50자:`, mdContent.substring(0, 50));
                    }
                    setContent(mdContent);
                } else {
                    if (file.path.toLowerCase().includes('readme')) {
                        devWarn(`[DEBUG] DocPage - 콘텐츠 로드 실패: ${file.path}`);
                    }
                }
            } else {
                setCurrentFile(null);
            }
            setLoading(false);
        };

        loadContent();
    }, [url, isSwiping]);

    const handleNavigate = useCallback((path) => {
        route(path);
    }, []);

    // 모바일 스와이프 이벤트 처리
    useEffect(() => {
        const minSwipeDistance = 50; // 최소 스와이프 거리 (픽셀)

        const handleTouchStart = (e) => {
            touchStartRef.current = e.touches[0].clientX;
            setIsSwiping(true);
            setSwipeOffset(0);
        };

        const handleTouchMove = (e) => {
            if (!touchStartRef.current) return;

            const currentX = e.touches[0].clientX;
            touchEndRef.current = currentX;

            const distance = touchStartRef.current - currentX;

            // 좌→우 스와이프만 허용 (오른쪽으로 드래그)
            if (distance < 0 && Math.abs(distance) > 10) {
                const offset = Math.min(Math.abs(distance), window.innerWidth);
                setSwipeOffset(offset);
                e.preventDefault(); // 스크롤 방지
            } else {
                setSwipeOffset(0);
            }
        };

        const handleTouchEnd = () => {
            if (!touchStartRef.current || !touchEndRef.current) {
                setIsSwiping(false);
                setSwipeOffset(0);
                return;
            }

            const distance = touchStartRef.current - touchEndRef.current;
            const isRightSwipe = distance < -minSwipeDistance;

            // 좌에서 우로 스와이프 (오른쪽으로 스와이프) = 상위 디렉토리로 이동
            if (isRightSwipe && window.innerWidth <= 768) {
                setIsSwiping(false);
                setSwipeOffset(0);

                // 현재 페이지를 우로 밀어내는 애니메이션
                setSlideDirection('right');

                // 애니메이션과 함께 네비게이션
                const { files } = getMarkdownFiles();
                const file = files.find((f) => f.route === currentRoute);

                let targetRoute = '/';

                if (file) {
                    // 현재 파일의 상위 디렉토리 경로 계산
                    if (file.directoryPath && file.directoryPath.length > 0) {
                        const parentPath = file.directoryPath.slice(0, -1);
                        if (parentPath.length > 0) {
                            targetRoute = `/category/${parentPath.join('/')}`;
                        } else {
                            // 최상위 카테고리로 이동
                            targetRoute = `/category/${file.category}`;
                        }
                    } else if (file.category) {
                        // 카테고리로 이동
                        targetRoute = `/category/${file.category}`;
                    }
                } else if (currentRoute.startsWith('/category/')) {
                    // 카테고리 경로인 경우 상위로 이동
                    const parts = currentRoute
                        .replace('/category/', '')
                        .split('/')
                        .filter((p) => p);
                    if (parts.length > 1) {
                        // 서브카테고리에서 카테고리로
                        targetRoute = `/category/${parts[0]}`;
                    } else if (parts.length === 1) {
                        // 카테고리에서 홈으로
                        targetRoute = '/';
                    }
                }

                // 애니메이션 완료 후 네비게이션
                setTimeout(() => {
                    handleNavigate(targetRoute);
                    setTimeout(() => {
                        setSlideDirection('none');
                    }, 50);
                }, 350);
            } else {
                setIsSwiping(false);
                setSwipeOffset(0);
            }

            // 리셋
            touchStartRef.current = null;
            touchEndRef.current = null;
        };

        const pageElement = document.querySelector('.page');
        if (pageElement && window.innerWidth <= 768) {
            pageElement.addEventListener('touchstart', handleTouchStart, { passive: false });
            pageElement.addEventListener('touchmove', handleTouchMove, { passive: false });
            pageElement.addEventListener('touchend', handleTouchEnd, { passive: true });

            return () => {
                if (pageElement) {
                    pageElement.removeEventListener('touchstart', handleTouchStart);
                    pageElement.removeEventListener('touchmove', handleTouchMove);
                    pageElement.removeEventListener('touchend', handleTouchEnd);
                }
            };
        }
    }, [currentRoute, handleNavigate]);

    const pageClass = `page ${slideDirection !== 'none' ? `page--slide-${slideDirection}` : ''} ${isSwiping ? 'page--swiping' : ''}`;
    const pageStyle = isSwiping && swipeOffset > 0 ? { transform: `translateX(${swipeOffset}px)` } : {};

    if (loading) {
        return (
            <div class={pageClass} style={pageStyle}>
                <LoadingSpinner />
            </div>
        );
    }

    if (!content) {
        return (
            <div class={pageClass} style={pageStyle}>
                <DirectoryView currentRoute={currentRoute} onNavigate={handleNavigate} />
            </div>
        );
    }

    // .template 파일인 경우 TemplateViewer 사용
    if (fileExt === '.template') {
        return (
            <div class={pageClass} style={pageStyle}>
                <TemplateViewer content={content} file={currentFile} />
            </div>
        );
    }

    return (
        <div class={pageClass} style={pageStyle}>
            <MarkdownViewer content={content} file={currentFile} />
        </div>
    );
}
