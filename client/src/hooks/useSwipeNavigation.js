import { useState, useEffect, useRef } from 'preact/hooks';

/**
 * 모바일 스와이프 네비게이션을 담당하는 Custom Hook
 * TDD 친화적: 터치 이벤트 로직을 분리하여 테스트 용이
 * 주의: 좌에서 우로 스와이프 시 상위 항목으로 이동하는 기능은 제거됨
 */
export function useSwipeNavigation(currentRoute, onNavigate) {
    const touchStartRef = useRef(null);
    const touchEndRef = useRef(null);
    const [slideDirection, setSlideDirection] = useState('none'); // 'left', 'right', 'none'
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const isHorizontalSwipeRef = useRef(false);

    // 모바일 스와이프 이벤트 처리
    useEffect(() => {
        // 스크롤 가능한 요소인지 확인하는 헬퍼 함수
        const isScrollableElement = (element) => {
            if (!element) return false;
            
            // 코드 블록, 테이블 등 스크롤 가능한 요소 확인
            const tagName = element.tagName?.toLowerCase();
            if (tagName === 'pre' || tagName === 'table' || tagName === 'code') {
                return true;
            }
            
            // 부모 요소 중 스크롤 가능한 요소 확인
            let parent = element.parentElement;
            while (parent && parent !== document.body) {
                const style = window.getComputedStyle(parent);
                const overflowX = style.overflowX || style.overflow;
                if (overflowX === 'auto' || overflowX === 'scroll') {
                    const parentTag = parent.tagName?.toLowerCase();
                    if (parentTag === 'pre' || parentTag === 'table') {
                        return true;
                    }
                }
                parent = parent.parentElement;
            }
            
            return false;
        };

        const handleTouchStart = (e) => {
            const target = e.target;
            
            // 스크롤 가능한 요소에서 시작된 터치인지 확인
            const isScrollable = isScrollableElement(target);
            
            touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                isScrollable, // 스크롤 가능한 요소인지 저장
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

            // 스크롤 가능한 요소에서 시작된 터치인 경우 preventDefault 호출하지 않음
            if (touchStartRef.current.isScrollable) {
                return;
            }

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
                    
                    // preventDefault 호출 시 cancelable 체크
                    if (e.cancelable) {
                        e.preventDefault();
                    }
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

            // 좌에서 우로 스와이프 기능 제거됨
            // 스와이프 종료 시 상태만 리셋
            setIsSwiping(false);
            setSwipeOffset(0);
            setSlideDirection('none');

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
    }, [currentRoute]);

    return {
        slideDirection,
        isSwiping,
        swipeOffset,
    };
}
