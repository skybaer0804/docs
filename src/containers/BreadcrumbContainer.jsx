import { useBreadcrumb } from '../hooks/useBreadcrumb';
import { BreadcrumbPresenter } from '../components/Breadcrumb';

/**
 * Breadcrumb Container 컴포넌트
 * 비즈니스 로직과 상태 관리를 담당
 * TDD 친화적: 로직을 분리하여 테스트 시 Mock으로 대체 가능
 */
export function BreadcrumbContainer({ currentRoute, onNavigate, onOpenSearch }) {
    const { items, displayType } = useBreadcrumb(currentRoute);

    return <BreadcrumbPresenter items={items} displayType={displayType} currentRoute={currentRoute} onNavigate={onNavigate} onOpenSearch={onOpenSearch} />;
}
