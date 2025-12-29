import { useEffect } from 'preact/hooks';
import { navigationObserver } from '../observers/NavigationObserver';

/**
 * NavigationObserver를 사용하는 Custom Hook
 * 컴포넌트에서 네비게이션 이벤트를 구독할 수 있도록 함
 * TDD 친화적: Observer 패턴을 Hook으로 래핑하여 테스트 용이
 */
export function useNavigationObserver(callback) {
    useEffect(() => {
        const unsubscribe = navigationObserver.subscribe(callback);
        return unsubscribe;
    }, [callback]);
}
