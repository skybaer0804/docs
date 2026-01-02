import { createContext, useContext, useEffect, useState } from 'preact/compat';
import { studyTimerObserver } from '../observers/StudyTimerObserver';

const StudyTimerContext = createContext(null);

export const StudyTimerProvider = ({ children }) => {
    const [state, setState] = useState(studyTimerObserver.getState());

    useEffect(() => {
        // Observer 구독
        const unsubscribe = studyTimerObserver.subscribe((nextState) => {
            setState(nextState);
        });

        // 타이머가 작동 중일 때 매초 상태 업데이트를 위해 interval 설정
        // (실제 시간 계산은 Observer 내부에서 Date.now() 기반으로 수행됨)
        let intervalId;
        if (state.status === 'recording') {
            intervalId = setInterval(() => {
                setState(studyTimerObserver.getState());
            }, 1000);
        }

        return () => {
            unsubscribe();
            if (intervalId) clearInterval(intervalId);
        };
    }, [state.status]);

    return (
        <StudyTimerContext.Provider value={state}>
            {children}
        </StudyTimerContext.Provider>
    );
};

export const useStudyTimerContext = () => {
    const context = useContext(StudyTimerContext);
    if (!context) {
        throw new Error('useStudyTimerContext must be used within StudyTimerProvider');
    }
    return context;
};

