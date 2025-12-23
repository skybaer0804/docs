import { IconLoader2 } from '@tabler/icons-preact';
import './LoadingSpinner.scss';

export function LoadingSpinner({ text = '로딩 중...' }) {
    return (
        <div class="loading-spinner">
            <IconLoader2 class="loading-spinner__icon" size={48} />
            {text && <p class="loading-spinner__text">{text}</p>}
        </div>
    );
}
