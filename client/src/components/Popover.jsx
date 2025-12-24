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
      
      // 기본적으로 anchor 아래에 배치 (오른쪽 정렬)
      let top = anchorRect.bottom + 8;
      let left = anchorRect.right - popoverRect.width;

      // 화면 밖으로 나가면 위치 조정
      if (top + popoverRect.height > window.innerHeight) {
        top = anchorRect.top - popoverRect.height - 8;
      }
      if (left + popoverRect.width > window.innerWidth) {
        left = window.innerWidth - popoverRect.width - 16;
      }
      if (left < 0) {
        left = anchorRect.left;
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

