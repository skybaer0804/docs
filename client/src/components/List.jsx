import './List.scss';

/**
 * 공용 List 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - ListItem 컴포넌트들
 * @param {string} props.className - 추가 CSS 클래스명
 */
export function List({ children, className = '' }) {
  return <ul className={`list ${className}`.trim()}>{children}</ul>;
}
