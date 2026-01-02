import './StudyTimer.scss';

/**
 * StudyTimerPresenter
 * 순공부 시간 측정 UI를 렌더링하는 순수 컴포넌트
 */
export const StudyTimerPresenter = ({
    status,
    formattedTime,
    onStart,
    onPause,
    onEnd
}) => {
    return (
        <section className="study-timer">
            <div className="study-timer__display">
                <div className="study-timer__display-time">
                    {formattedTime}
                </div>
                <div className={`study-timer__display-status study-timer__display-status--${status}`}>
                    {status === 'idle' ? '준비' : status === 'recording' ? '공부 중' : '일시정지'}
                </div>
            </div>

            <div className="study-timer__controls">
                <button
                    type="button"
                    className="study-timer__button study-timer__button--start"
                    onClick={onStart}
                    disabled={status === 'recording'}
                >
                    {status === 'paused' ? '재개' : '시작'}
                </button>
                <button
                    type="button"
                    className="study-timer__button study-timer__button--pause"
                    onClick={onPause}
                    disabled={status !== 'recording'}
                >
                    일시정지
                </button>
                <button
                    type="button"
                    className="study-timer__button study-timer__button--end"
                    onClick={onEnd}
                    disabled={status === 'idle'}
                >
                    종료
                </button>
            </div>
        </section>
    );
};

