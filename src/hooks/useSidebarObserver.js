import { useEffect, useState } from 'preact/hooks';
import { sidebarObserver } from '../observers/SidebarObserver';

/**
 * SidebarObserver를 사용하는 Custom Hook
 * 컴포넌트에서 사이드바 상태를 구독할 수 있도록 함
 * TDD 친화적: Observer 패턴을 Hook으로 래핑하여 테스트 용이
 */
export function useSidebarObserver() {
    const [state, setState] = useState(() => sidebarObserver.getState());

    useEffect(() => {
        const unsubscribe = sidebarObserver.subscribe((newState) => {
            setState(newState);
        });
        return unsubscribe;
    }, []);

    return state;
}
