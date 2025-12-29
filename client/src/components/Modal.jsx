import { useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { IconX } from '@tabler/icons-preact';
import './Modal.scss';

/**
 * 공용 Modal 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 여부
 * @param {Function} props.onClose - 모달 닫기 핸들러
 * @param {string} props.title - 모달 제목
 * @param {import('preact').ComponentChildren} props.children - 모달 본문
 * @param {import('preact').ComponentChildren} [props.footer] - 모달 하단 버튼 영역 (선택사항)
 * @param {string} [props.maxWidth] - 최대 너비 (기본값: 500px)
 */
export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '500px' }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // 모달 오픈 시 본문 스크롤 방지
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) {
          onClose?.();
        }
      }}
    >
      <div className="modal-container" ref={modalRef} role="dialog" aria-modal="true" style={{ maxWidth }}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">
            <IconX size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}


