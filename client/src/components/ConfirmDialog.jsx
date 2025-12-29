import { useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { Button } from './Button';
import './ConfirmDialog.scss';

/**
 * 공용 ConfirmDialog 컴포넌트
 * - window.confirm 대체용 (테스트/디자인 일관성)
 */
export function ConfirmDialog({
  isOpen,
  title = '확인',
  message = '',
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // 오픈 시 포커스 이동(기본은 취소)
    window.setTimeout(() => cancelButtonRef.current?.focus?.(), 0);

    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (loading) return;
      onClose?.();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="confirm-dialog__overlay"
      onClick={(e) => {
        if (loading) return;
        if (e.target.classList.contains('confirm-dialog__overlay')) {
          onClose?.();
        }
      }}
    >
      <div className="confirm-dialog__container" ref={dialogRef} role="dialog" aria-modal="true" aria-label={title}>
        <div className="confirm-dialog__header">
          <h2 className="confirm-dialog__title">{title}</h2>
        </div>
        <div className="confirm-dialog__body">
          <p className="confirm-dialog__message">{message}</p>
        </div>
        <div className="confirm-dialog__footer">
          <Button
            buttonRef={cancelButtonRef}
            type="button"
            variant="secondary"
            onClick={() => onClose?.()}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={() => onConfirm?.()} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
