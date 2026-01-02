import { useStudyTimer } from '../hooks/useStudyTimer';
import { StudyTimerPresenter } from '../components/StudyTimerPresenter';
import { useToast } from '../contexts/ToastContext';

/**
 * StudyTimerContainer
 * 비즈니스 로직(useStudyTimer)과 UI(StudyTimerPresenter)를 연결하는 컨테이너
 */
export const StudyTimerContainer = () => {
    const { status, formattedTime, start, pause, end } = useStudyTimer();
    const { showToast, showError, showSuccess } = useToast();

    const handleStart = async () => {
        try {
            await start();
        } catch (err) {
            showError('타이머 시작에 실패했습니다: ' + err.message);
        }
    };

    const handleEnd = () => {
        showToast('공부를 종료하고 저장하시겠습니까?', 'warning', 0, {
            label: '종료 및 저장',
            onClick: async () => {
                try {
                    await end();
                    showSuccess('공부 기록이 성공적으로 저장되었습니다.');
                } catch (err) {
                    showError('저장 중 오류가 발생했습니다. 기록은 로컬에 임시 저장됩니다.');
                }
            }
        });
    };

    return (
        <StudyTimerPresenter
            status={status}
            formattedTime={formattedTime}
            onStart={handleStart}
            onPause={pause}
            onEnd={handleEnd}
        />
    );
};

