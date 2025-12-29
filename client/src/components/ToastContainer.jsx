import { Toast } from './Toast';
import './Toast.scss';

/**
 * ToastContainer 컴포넌트
 * 여러 Toast를 관리하는 컨테이너
 */
export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          isOpen={toast.isOpen}
          onClose={() => onClose(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}

