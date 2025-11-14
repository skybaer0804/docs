import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * 리사이저 기능을 담당하는 Custom Hook
 * TDD 친화적: DOM 조작 로직을 분리하여 테스트 용이
 */
export function useResizer({ onResize, minSidebarWidth = 200, minContentWidth = 300 }) {
    const resizerRef = useRef(null);
    const isResizingRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const handleMouseDown = (e) => {
            if (e.button !== 0) return; // 왼쪽 마우스 버튼만
            isResizingRef.current = true;
            setIsDragging(true);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        };

        const handleMouseMove = (e) => {
            if (!isResizingRef.current) return;

            const container = document.querySelector('.layout__container');
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const mouseX = e.clientX - containerRect.left;
            const sidebarWidth = mouseX;

            // 최소/최대 width 제한
            const maxSidebarWidth = containerRect.width - minContentWidth;
            const constrainedWidth = Math.max(minSidebarWidth, Math.min(sidebarWidth, maxSidebarWidth));

            if (onResize) {
                onResize(constrainedWidth);
            }
        };

        const handleMouseUp = () => {
            if (isResizingRef.current) {
                isResizingRef.current = false;
                setIsDragging(false);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        const resizer = resizerRef.current;
        if (resizer) {
            resizer.addEventListener('mousedown', handleMouseDown);
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            if (resizer) {
                resizer.removeEventListener('mousedown', handleMouseDown);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onResize, minSidebarWidth, minContentWidth]);

    return {
        resizerRef,
        isDragging,
    };
}
