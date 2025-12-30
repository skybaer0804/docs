import { useEffect } from 'preact/hooks';
import { IconX, IconCheck, IconAlertCircle, IconInfoCircle } from '@tabler/icons-preact';
import './Toast.scss';

/**
 * Toast 컴포넌트
 * @param {Object} props
 * @param {string} props.message - 표시할 메시지
 * @param {string} props.type - 'success' | 'error' | 'info' | 'warning'
 * @param {boolean} props.isOpen - Toast 표시 여부
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {number} props.duration - 자동 닫기 시간 (ms, 기본값: 3000)
 * @param {Object} props.action - 커스텀 액션 { label: string, onClick: function }
 */
export function Toast({ message, type = 'info', isOpen, onClose, duration = 3000, action }) {
  useEffect(() => {
    if (!isOpen || action) return; // 액션이 있는 경우 자동 종료 비활성화 (사용자 확인 필요)

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose, action]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IconCheck size={20} />;
      case 'error':
        return <IconAlertCircle size={20} />;
      case 'warning':
        return <IconAlertCircle size={20} />;
      default:
        return <IconInfoCircle size={20} />;
    }
  };

  return (
    <div className={`toast toast--${type} ${action ? 'toast--has-action' : ''}`}>
      <div className="toast__icon">{getIcon()}</div>
      <div className="toast__content">
        <div className="toast__message">{message}</div>
        {action && (
          <button 
            className="toast__action" 
            onClick={() => {
              action.onClick();
              onClose();
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button className="toast__close" onClick={onClose} aria-label="닫기">
        <IconX size={16} />
      </button>
    </div>
  );
}
