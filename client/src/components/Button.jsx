import { IconLoader2 } from '@tabler/icons-preact';
import './Button.scss';

/**
 * 공용 Button 컴포넌트
 * variant: 'primary' | 'secondary' | 'info' | 'warning' | 'danger'
 * size: 'small' | 'medium' | 'large'
 * loading: 로딩 상태일 때 true
 */
export function Button({ 
    children, 
    variant = 'secondary', 
    size = 'medium',
    type = 'button',
    disabled = false,
    loading = false,
    onClick,
    className = '',
    buttonRef,
    ...props 
}) {
    const buttonClass = `button button--${variant} button--${size} ${loading ? 'button--loading' : ''} ${className}`.trim();
    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            class={buttonClass}
            disabled={isDisabled}
            onClick={onClick}
            ref={buttonRef}
            {...props}
        >
            {loading && <IconLoader2 class="button__loader" size={16} />}
            <span class="button__text">{children}</span>
        </button>
    );
}

