import { useEffect, useRef } from 'preact/hooks';
import './Popover.scss';

/**
 * 공용 Popover 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - Popover 열림 여부
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {React.ReactNode} props.children - Popover 내용
 * @param {string} props.className - 추가 CSS 클래스명
 * @param {Object} props.anchorRef - Popover가 위치할 기준 요소의 ref
 */
export function Popover({ isOpen, onClose, children, className = '', anchorRef }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    // Popover 위치 조정
    if (popoverRef.current && anchorRef?.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      
      // anchor의 시작점(left-top) 기준 우하단에 배치
      let top = anchorRect.top + 8; // anchor 시작점 아래
      let left = anchorRect.left + 8; // anchor 시작점 오른쪽

      // 화면 밖으로 나가면 위치 조정
      if (top + popoverRect.height > window.innerHeight) {
        // 아래 공간이 부족하면 위쪽에 배치
        top = anchorRect.bottom - popoverRect.height - 8;
      }
      if (left + popoverRect.width > window.innerWidth) {
        // 오른쪽 공간이 부족하면 왼쪽으로 이동
        left = window.innerWidth - popoverRect.width - 16;
      }
      if (left < 0) {
        left = 8; // 최소 여백 유지
      }
      if (top < 0) {
        top = 8; // 최소 여백 유지
      }

      popoverRef.current.style.top = `${top}px`;
      popoverRef.current.style.left = `${left}px`;
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div className={`popover ${className}`.trim()} ref={popoverRef}>
      {children}
    </div>
  );
}

