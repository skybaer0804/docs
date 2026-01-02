import { useEffect, useRef, useState } from 'preact/hooks';
import { fetchStudySessions } from '../../utils/api';
import './StudyTable.scss';

export const StudyTable = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const observerTarget = useRef(null);
    const LIMIT = 20;

    const loadMore = async () => {
        if (loading || !hasMore) return;
        
        setLoading(true);
        try {
            const newSessions = await fetchStudySessions(LIMIT, offset);
            if (newSessions.length < LIMIT) {
                setHasMore(false);
            }
            setSessions(prev => [...prev, ...newSessions]);
            setOffset(prev => prev + LIMIT);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMore();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [offset, hasMore, loading]);

    const formatDuration = (seconds) => {
        if (!seconds) return '-';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    return (
        <div className="study-table">
            <div className="study-table__wrapper">
                <table className="study-table__table">
                    <thead>
                        <tr>
                            <th>시작 시간</th>
                            <th>종료 시간</th>
                            <th>공부 시간</th>
                            <th>상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(session => (
                            <tr key={session.id}>
                                <td>{formatDate(session.start_at)}</td>
                                <td>{session.end_at ? formatDate(session.end_at) : '-'}</td>
                                <td>{formatDuration(session.pure_duration)}</td>
                                <td>
                                    <span className={`study-table__status study-table__status--${session.status}`}>
                                        {session.status === 'completed' ? '완료' : '진행 중'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div ref={observerTarget} className="study-table__sentinel">
                    {loading && <div className="study-table__loading">추가 기록 로딩 중...</div>}
                    {!hasMore && sessions.length > 0 && <div className="study-table__end">마지막 기록입니다.</div>}
                    {!loading && sessions.length === 0 && <div className="study-table__empty">기록이 없습니다.</div>}
                </div>
            </div>
        </div>
    );
};

