import { useStudyTimerContext } from '../contexts/StudyTimerContext';
import { studyTimerObserver } from '../observers/StudyTimerObserver';

/**
 * useStudyTimer
 * 컴포넌트에서 순공부 시간 측정 기능을 제어하기 위한 훅
 */
export const useStudyTimer = () => {
    const state = useStudyTimerContext();

    const start = () => studyTimerObserver.start();
    const pause = () => studyTimerObserver.pause();
    const end = () => studyTimerObserver.end();

    // 초 단위 시간 계산
    const elapsedSeconds = Math.floor(state.elapsedMs / 1000);
    
    // 시:분:초 포맷팅
    const formatTime = () => {
        const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(elapsedSeconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return {
        ...state,
        elapsedSeconds,
        formattedTime: formatTime(),
        start,
        pause,
        end
    };
};

