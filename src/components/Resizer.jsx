import { useResizer } from '../hooks/useResizer';
import './Resizer.scss';

/**
 * Resizer 컴포넌트
 * Custom Hook을 사용하여 로직 분리
 * TDD 친화적: Hook을 통해 로직을 테스트 가능
 */
export function Resizer({ onResize, minSidebarWidth = 200, minContentWidth = 300 }) {
    const { resizerRef, isDragging } = useResizer({ onResize, minSidebarWidth, minContentWidth });

    return <div ref={resizerRef} class={`resizer ${isDragging ? 'resizer--dragging' : ''}`} />;
}
