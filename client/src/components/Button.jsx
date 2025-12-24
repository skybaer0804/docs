import './Button.scss';

/**
 * 공용 Button 컴포넌트
 * variant: 'primary' | 'secondary' | 'info' | 'warning' | 'danger'
 * size: 'small' | 'medium' | 'large'
 */
export function Button({ 
    children, 
    variant = 'secondary', 
    size = 'medium',
    type = 'button',
    disabled = false,
    onClick,
    className = '',
    ...props 
}) {
    const buttonClass = `button button--${variant} button--${size} ${className}`.trim();

    return (
        <button
            type={type}
            class={buttonClass}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
}

