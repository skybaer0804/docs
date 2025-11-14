import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { getMarkdownFiles } from '../utils/markdownLoader';
import { navigationObserver } from '../observers/NavigationObserver';

/**
 * 모바일 스와이프 네비게이션을 담당하는 Custom Hook
 * TDD 친화적: 터치 이벤트 로직을 분리하여 테스트 용이
 */
export function useSwipeNavigation(currentRoute, onNavigate) {
    const touchStartRef = useRef(null);
    const touchEndRef = useRef(null);
    const [slideDirection, setSlideDirection] = useState('none'); // 'left', 'right', 'none'
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const isHorizontalSwipeRef = useRef(false);
    const isNavigatingFromSwipeRef = useRef(false);

    const handleNavigate = useCallback(
        (path) => {
            if (onNavigate) {
                onNavigate(path);
            }
        },
        [onNavigate]
    );

    // 모바일 스와이프 이벤트 처리
    useEffect(() => {
        const minSwipeDistance = 50; // 최소 스와이프 거리 (픽셀)

        const handleTouchStart = (e) => {
            touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
            setIsSwiping(false);
            setSwipeOffset(0);
            setSlideDirection('none');
            isHorizontalSwipeRef.current = false;
        };

        const handleTouchMove = (e) => {
            if (!touchStartRef.current) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = Math.abs(touchStartRef.current.x - currentX);
            const deltaY = Math.abs(touchStartRef.current.y - currentY);

            // 수평 스와이프인지 수직 스크롤인지 판단
            // 수평 이동이 수직 이동보다 크고, 최소 거리 이상일 때만 스와이프로 인식
            if (!isHorizontalSwipeRef.current && deltaX > 10 && deltaX > deltaY * 1.5) {
                isHorizontalSwipeRef.current = true;
                setIsSwiping(true);
            }

            // 수평 스와이프인 경우에만 처리
            if (isHorizontalSwipeRef.current) {
                touchEndRef.current = currentX;
                const distance = touchStartRef.current.x - currentX;

                // 좌→우 스와이프만 허용 (오른쪽으로 드래그)
                if (distance < 0 && Math.abs(distance) > 10) {
                    const offset = Math.min(Math.abs(distance), window.innerWidth);
                    setSwipeOffset(offset);
                    // 스와이프 중에도 상위 페이지가 보이도록 슬라이드 방향 설정
                    setSlideDirection('right');
                    e.preventDefault(); // 스크롤 방지
                } else {
                    setSwipeOffset(0);
                    setSlideDirection('none');
                }
            }
            // 수직 스크롤인 경우 preventDefault()를 호출하지 않음
        };

        const handleTouchEnd = () => {
            if (!touchStartRef.current) {
                setIsSwiping(false);
                setSwipeOffset(0);
                isHorizontalSwipeRef.current = false;
                return;
            }

            // 수평 스와이프가 아니었던 경우 처리하지 않음
            if (!isHorizontalSwipeRef.current || !touchEndRef.current) {
                setIsSwiping(false);
                setSwipeOffset(0);
                isHorizontalSwipeRef.current = false;
                touchStartRef.current = null;
                touchEndRef.current = null;
                return;
            }

            const distance = touchStartRef.current.x - touchEndRef.current;
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
                isNavigatingFromSwipeRef.current = true;
                setTimeout(() => {
                    // SPA 구조: 애니메이션 옵션과 함께 네비게이션
                    // 상위 페이지 콘텐츠가 이미 보이고 있으므로 즉시 네비게이션
                    handleNavigate(targetRoute, {
                        animate: true,
                        direction: 'right',
                        type: 'swipe',
                    });
                    // Observer 패턴: 네비게이션 이벤트 알림
                    navigationObserver.notify(targetRoute, { from: currentRoute, type: 'swipe' });
                    // 네비게이션 후 약간의 지연 후 슬라이드 방향 리셋 (콘텐츠 로드 대기)
                    setTimeout(() => {
                        setSlideDirection('none');
                        isNavigatingFromSwipeRef.current = false;
                    }, 150);
                }, 350);
            } else {
                setIsSwiping(false);
                setSwipeOffset(0);
                setSlideDirection('none');
            }

            // 리셋
            touchStartRef.current = null;
            touchEndRef.current = null;
            isHorizontalSwipeRef.current = false;
        };

        const slideContainer = document.querySelector('.slide-container') || document.querySelector('.page');
        if (slideContainer && window.innerWidth <= 768) {
            slideContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            slideContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            slideContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

            return () => {
                if (slideContainer) {
                    slideContainer.removeEventListener('touchstart', handleTouchStart);
                    slideContainer.removeEventListener('touchmove', handleTouchMove);
                    slideContainer.removeEventListener('touchend', handleTouchEnd);
                }
            };
        }
    }, [currentRoute, handleNavigate]);

    // 페이지 전환 애니메이션 처리
    useEffect(() => {
        if (window.innerWidth <= 768 && currentRoute && !isSwiping) {
            // 스와이프로 인한 네비게이션이 아닌 경우에만 슬라이드 방향 리셋
            if (!isNavigatingFromSwipeRef.current) {
                setSlideDirection('none');
            }
        }
    }, [currentRoute, isSwiping]);

    return {
        slideDirection,
        isSwiping,
        swipeOffset,
    };
}
