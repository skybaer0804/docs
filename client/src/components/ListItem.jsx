import './ListItem.scss';

/**
 * 공용 ListItem 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - ListItem 내용
 * @param {Function} props.onClick - 클릭 핸들러
 * @param {string} props.className - 추가 CSS 클래스명
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {React.ReactNode} props.icon - 왼쪽 아이콘
 * @param {React.ReactNode} props.rightIcon - 오른쪽 아이콘
 */
export function ListItem({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  icon,
  rightIcon,
  ...props 
}) {
  const listItemClass = `list-item ${disabled ? 'list-item--disabled' : ''} ${className}`.trim();

  const content = (
    <>
      {icon && <span className="list-item__icon">{icon}</span>}
      <span className="list-item__content">{children}</span>
      {rightIcon && <span className="list-item__right-icon">{rightIcon}</span>}
    </>
  );

  if (onClick) {
    return (
      <li className={listItemClass}>
        <button 
          className="list-item__button" 
          onClick={onClick} 
          disabled={disabled}
          {...props}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li className={listItemClass} {...props}>
      {content}
    </li>
  );
}

