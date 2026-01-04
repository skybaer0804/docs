import { useEffect, useRef, useState } from 'preact/hooks';
import { fetchStudySessions, deleteStudySession } from '../../utils/api';
import { Popover } from '../Popover';
import { List } from '../List';
import { ListItem } from '../ListItem';
import { IconTrash } from '@tabler/icons-preact';
import { useToast } from '../../contexts/ToastContext';
import './StudyTable.scss';

export const StudyTable = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [selectedSession, setSelectedSession] = useState(null);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const anchorRef = useRef(null);
    const observerTarget = useRef(null);
    const { showSuccess, showError } = useToast();
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

    const handleRowClick = (e, session) => {
        anchorRef.current = e.currentTarget;
        setSelectedSession(session);
        setPopoverOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedSession) return;
        
        if (confirm('이 공부 기록을 삭제하시겠습니까?')) {
            try {
                await deleteStudySession(selectedSession.id);
                setSessions(prev => prev.filter(s => s.id !== selectedSession.id));
                showSuccess('공부 기록이 삭제되었습니다.');
            } catch (err) {
                showError('기록 삭제에 실패했습니다.');
            } finally {
                setPopoverOpen(false);
                setSelectedSession(null);
            }
        }
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
                            <tr 
                                key={session.id} 
                                onClick={(e) => handleRowClick(e, session)}
                                className="study-table__row"
                            >
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

            <Popover
                isOpen={popoverOpen}
                onClose={() => setPopoverOpen(false)}
                anchorRef={anchorRef}
            >
                <List>
                    <ListItem
                        className="list-item--danger"
                        icon={<IconTrash size={18} />}
                        onClick={handleDelete}
                    >
                        삭제
                    </ListItem>
                </List>
            </Popover>
        </div>
    );
};

