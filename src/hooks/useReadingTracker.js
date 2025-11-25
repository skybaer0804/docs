import { useEffect, useRef, useState } from 'preact/hooks';
import { incrementReadingCount, getReadingCount } from '../utils/readingHistory';
import { showReadingCompleteNotification } from '../utils/notificationService';

/**
 * 문서 회독 추적을 담당하는 Custom Hook
 * 스크롤을 감지하여 문서를 끝까지 읽었는지 확인하고 회독 횟수를 증가시킴
 * TDD 친화적: 로직을 분리하여 테스트 용이
 *
 * @param {Object} options - 옵션
 * @param {Object} options.contentRef - 마크다운 콘텐츠 DOM 참조
 * @param {Object} options.file - 현재 파일 정보
 * @param {boolean} options.enabled - 추적 활성화 여부 (기본값: true)
 * @param {number} options.threshold - 끝까지 읽었다고 판단할 스크롤 임계값 (0~1, 기본값: 0.95)
 */
export function useReadingTracker({ contentRef, file, enabled = true, threshold = 0.95 }) {
    const hasNotifiedRef = useRef(false);
    const lastFileNameRef = useRef(null);
    const [contentElementReady, setContentElementReady] = useState(false);
    const hasScrolledRef = useRef(false); // 사용자가 실제로 스크롤했는지 추적
    const initialScrollTopRef = useRef(null); // 초기 스크롤 위치 저장

    useEffect(() => {
        // 파일이 변경되면 알림 상태 초기화
        if (file && file.path && file.path !== lastFileNameRef.current) {
            hasNotifiedRef.current = false;
            lastFileNameRef.current = file.path;
            hasScrolledRef.current = false;
            initialScrollTopRef.current = null;
        }
    }, [file]);

    // contentRef.current가 준비되었는지 확인
    useEffect(() => {
        if (!contentRef) {
            setContentElementReady(false);
            return;
        }

        const checkElement = () => {
            const element = contentRef.current;
            if (element && typeof element.getBoundingClientRect === 'function') {
                setContentElementReady(true);
            } else {
                setContentElementReady(false);
            }
        };

        // 즉시 확인
        checkElement();

        // 주기적으로 확인 (DOM이 늦게 렌더링될 수 있음)
        const interval = setInterval(() => {
            checkElement();
        }, 100);

        return () => clearInterval(interval);
    }, [contentRef, file?.path]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        if (!file?.path) {
            return;
        }

        if (!contentElementReady) {
            return;
        }

        // contentRef에서 실제 DOM 요소 가져오기
        const getContentElement = () => {
            if (!contentRef) return null;
            // ref 객체인 경우
            if (contentRef.current !== undefined) {
                return contentRef.current;
            }
            // 직접 DOM 요소인 경우
            return contentRef;
        };

        const contentElement = getContentElement();
        if (!contentElement || typeof contentElement.getBoundingClientRect !== 'function') {
            return;
        }

        const fileName = file.path.split('/').pop() || file.name || file.path;

        // 이미 알림을 표시했으면 더 이상 추적하지 않음
        if (hasNotifiedRef.current && file.path === lastFileNameRef.current) {
            return;
        }

        /**
         * 스크롤이 끝에 도달했는지 확인
         * 실제 스크롤 컨테이너(.layout__main)의 스크롤을 확인
         */
        const checkReadingComplete = (isInitialCheck = false) => {
            const element = getContentElement();
            if (!element || typeof element.getBoundingClientRect !== 'function') {
                return;
            }

            let scrollPercentage = 0;
            let scrollType = 'unknown';
            let isScrollable = false;

            // 실제 스크롤 컨테이너 찾기
            const scrollContainer = findScrollContainerForCheck();

            // contentElement 자체가 스크롤 가능한 경우
            if (element.scrollHeight > element.clientHeight) {
                scrollType = 'element-scroll';
                isScrollable = true;
                const scrollTop = element.scrollTop;
                const scrollHeight = element.scrollHeight;
                const clientHeight = element.clientHeight;
                const scrollableHeight = scrollHeight - clientHeight;

                if (scrollableHeight > 0) {
                    scrollPercentage = scrollTop / scrollableHeight;
                } else {
                    return;
                }
            } else if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
                // 실제 스크롤 컨테이너의 스크롤 확인
                scrollType = 'container-scroll';
                isScrollable = true;
                const scrollTop = scrollContainer.scrollTop;
                const scrollHeight = scrollContainer.scrollHeight;
                const clientHeight = scrollContainer.clientHeight;
                const scrollableHeight = scrollHeight - clientHeight;

                if (scrollableHeight > 0) {
                    scrollPercentage = scrollTop / scrollableHeight;
                } else {
                    return;
                }

                // 요소의 하단이 스크롤 컨테이너의 뷰포트에 보이는지 확인
                const elementRect = element.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();
                const elementBottom = elementRect.bottom;
                const containerBottom = containerRect.bottom;
                const distanceFromContainerBottom = containerBottom - elementBottom;
                const isElementBottomVisible = distanceFromContainerBottom >= -200;
            } else {
                // window 스크롤을 사용하는 경우 (fallback)
                scrollType = 'window-scroll';
                const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const windowScrollHeight = document.documentElement.scrollHeight;
                const windowClientHeight = window.innerHeight;
                const windowScrollableHeight = windowScrollHeight - windowClientHeight;

                // 스크롤 가능한 높이가 0이거나 매우 작은 경우 처리
                if (windowScrollableHeight <= 10) {
                    // 사용자가 스크롤했다면 요소의 하단이 화면에 보이는지 확인
                    if (hasScrolledRef.current) {
                        const elementRect = element.getBoundingClientRect();
                        const elementBottom = elementRect.bottom;
                        const distanceFromBottom = windowClientHeight - elementBottom;
                        const isElementBottomVisible = distanceFromBottom >= -50;

                        if (isElementBottomVisible) {
                            scrollPercentage = 1;
                            isScrollable = true; // 체크를 계속 진행
                        } else {
                            return;
                        }
                    } else {
                        // 사용자가 아직 스크롤하지 않았으면 체크하지 않음
                        return;
                    }
                } else {
                    isScrollable = true;

                    // 초기 스크롤 위치 저장
                    if (initialScrollTopRef.current === null) {
                        initialScrollTopRef.current = windowScrollTop;
                    }

                    // contentElement의 위치 확인
                    const elementRect = element.getBoundingClientRect();
                    const elementTop = elementRect.top;
                    const elementBottom = elementRect.bottom;
                    const elementHeight = elementRect.height;
                    const distanceFromBottom = windowClientHeight - elementBottom;
                    // 요소 하단이 화면 하단보다 위에 있거나, 화면 하단에서 200px 이내에 있으면 완료로 간주
                    const isElementBottomVisible = distanceFromBottom >= -200;

                    // 요소의 끝 부분(하단 10%)이 화면에 보이는지 확인
                    const elementBottom10Percent = elementTop + elementHeight * 0.9;
                    const isBottom10PercentVisible = elementBottom10Percent <= windowClientHeight + 200;

                    // window 스크롤이 끝에 가까운지 확인 (90% 이상 스크롤로 낮춤)
                    const windowScrollPercentage = windowScrollableHeight > 0 ? windowScrollTop / windowScrollableHeight : 0;

                    // 요소 하단이 보이거나, 요소의 하단 10%가 보이거나, window 스크롤이 거의 끝에 도달했으면 완료로 간주
                    if (isElementBottomVisible || isBottom10PercentVisible || windowScrollPercentage >= 0.9) {
                        scrollPercentage = 1;
                    } else {
                        scrollPercentage = windowScrollPercentage;
                    }
                }
            }

            // 초기 체크이고 스크롤 가능한 경우, 사용자가 스크롤하지 않았으면 체크하지 않음
            if (isInitialCheck && isScrollable && !hasScrolledRef.current) {
                return;
            }

            if (scrollPercentage >= threshold) {
                // 이미 알림을 표시했는지 확인
                if (!hasNotifiedRef.current || file.path !== lastFileNameRef.current) {
                    // 회독 횟수 증가
                    const count = incrementReadingCount(fileName);

                    // 알림 표시
                    showReadingCompleteNotification(count, fileName).catch((error) => {
                        console.error('[useReadingTracker] 알림 표시 실패:', error);
                    });

                    hasNotifiedRef.current = true;
                    lastFileNameRef.current = file.path;
                }
            }
        };

        // 실제 스크롤 컨테이너 찾기 함수 (공통 사용)
        const findScrollContainerForCheck = () => {
            const el = getContentElement();
            if (!el) return null;

            let current = el;
            while (current && current !== document.body) {
                const style = window.getComputedStyle(current);
                const hasScroll = current.scrollHeight > current.clientHeight;
                const overflowY = style.overflowY || style.overflow;

                if (hasScroll && (overflowY === 'auto' || overflowY === 'scroll')) {
                    return current;
                }
                current = current.parentElement;
            }

            const layoutMain = document.querySelector('.layout__main');
            return layoutMain || null;
        };

        // 스크롤 이벤트 핸들러 (사용자가 스크롤했음을 표시)
        const handleScroll = () => {
            hasScrolledRef.current = true;
            checkReadingComplete(false);
        };

        // 실제 스크롤 컨테이너 찾기 (.layout__main) - 리스너 등록용
        const findScrollContainer = () => {
            return findScrollContainerForCheck();
        };

        // 스크롤 이벤트 리스너 추가
        const element = getContentElement();
        const scrollContainer = findScrollContainer();

        if (scrollContainer && typeof scrollContainer.addEventListener === 'function') {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        } else if (element && typeof element.addEventListener === 'function') {
            if (element.scrollHeight > element.clientHeight) {
                element.addEventListener('scroll', handleScroll, { passive: true });
            } else {
                window.addEventListener('scroll', handleScroll, { passive: true });
            }
        } else {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        // 초기 체크는 제거 (사용자가 실제로 스크롤할 때만 체크)
        // DOM이 완전히 렌더링된 후 초기 스크롤 위치만 저장
        const initialCheckTimeout = setTimeout(() => {
            const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop;
            initialScrollTopRef.current = windowScrollTop;
        }, 500);

        // 리사이즈 이벤트도 감지 (콘텐츠 높이 변경 시)
        const handleResize = () => {
            // 리사이즈 시에는 사용자가 스크롤했는지와 관계없이 체크
            checkReadingComplete(false);
        };
        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            clearTimeout(initialCheckTimeout);
            const element = getContentElement();
            const scrollContainer = findScrollContainer();

            if (scrollContainer && typeof scrollContainer.removeEventListener === 'function') {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener('scroll', handleScroll);
            }
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [contentRef, file, enabled, threshold, contentElementReady]);
}
