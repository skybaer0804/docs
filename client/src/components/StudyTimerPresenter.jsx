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
    onEnd,
    activeTab,
    onTabChange,
    children
}) => {
    return (
        <section className="study-timer">
            <div className="study-timer__top-bar">
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
            </div>

            <div className="study-timer__tabs">
                <button 
                    className={`study-timer__tab ${activeTab === 'overview' ? 'study-timer__tab--active' : ''}`}
                    onClick={() => onTabChange('overview')}
                >
                    Overview
                </button>
                <button 
                    className={`study-timer__tab ${activeTab === 'table' ? 'study-timer__tab--active' : ''}`}
                    onClick={() => onTabChange('table')}
                >
                    Table
                </button>
            </div>

            <div className="study-timer__content">
                {children}
            </div>
        </section>
    );
};

