import { useEffect, useRef, useState } from 'preact/hooks';
import { showTimerNotification } from '../utils/notificationService';

/**
 * 경과 시간 기반 알림을 담당하는 Custom Hook
 * 1분, 10분, 30분, 1시간 경과 시 알림 표시
 * TDD 친화적: 로직을 분리하여 테스트 용이
 * 
 * @param {Object} options - 옵션
 * @param {boolean} options.enabled - 타이머 활성화 여부 (기본값: true)
 * @param {boolean} options.isDocumentVisible - 문서가 보이는지 여부 (기본값: true)
 */
export function useTimerNotification({ enabled = true, isDocumentVisible: initialIsDocumentVisible = true } = {}) {
    const startTimeRef = useRef(null);
    const timersRef = useRef([]);
    const notifiedMinutesRef = useRef(new Set());
    const enabledRef = useRef(enabled);
    const isDocumentVisibleRef = useRef(initialIsDocumentVisible);
    const [isDocumentVisible, setIsDocumentVisible] = useState(() => {
        if (typeof document !== 'undefined') {
            return !document.hidden;
        }
        return initialIsDocumentVisible;
    });
    
    // ref 업데이트
    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);
    
    useEffect(() => {
        isDocumentVisibleRef.current = isDocumentVisible;
    }, [isDocumentVisible]);
    
    // 타이머 알림 시간 (분)
    const NOTIFICATION_TIMES = [1, 10, 30, 60];
    
    // 문서 가시성 변경 감지
    useEffect(() => {
        if (typeof document === 'undefined') return;
        
        const handleVisibilityChange = () => {
            setIsDocumentVisible(!document.hidden);
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
    
    useEffect(() => {
        if (!enabled || !isDocumentVisible) {
            // 타이머 초기화
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current = [];
            notifiedMinutesRef.current.clear();
            return;
        }
        
        // 시작 시간 설정 (처음 마운트되거나 활성화될 때)
        if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
        }
        
        /**
         * 특정 시간(분) 경과 후 알림 표시
         */
        const scheduleNotification = (minutes) => {
            // 이미 알림을 표시했으면 스킵
            if (notifiedMinutesRef.current.has(minutes)) {
                return;
            }
            
            const milliseconds = minutes * 60 * 1000;
            const elapsed = Date.now() - startTimeRef.current;
            
            // 이미 경과한 시간이면 즉시 알림 표시
            if (elapsed >= milliseconds) {
                showTimerNotification(minutes).catch((error) => {
                    console.warn('[useTimerNotification] 알림 표시 실패:', error);
                });
                notifiedMinutesRef.current.add(minutes);
                return;
            }
            
            // 아직 경과하지 않았으면 타이머 설정
            const remainingTime = milliseconds - elapsed;
            const timer = setTimeout(() => {
                showTimerNotification(minutes).catch((error) => {
                    console.warn('[useTimerNotification] 알림 표시 실패:', error);
                });
                notifiedMinutesRef.current.add(minutes);
            }, remainingTime);
            
            timersRef.current.push(timer);
        };
        
        // 각 알림 시간에 대해 타이머 설정
        NOTIFICATION_TIMES.forEach((minutes) => {
            scheduleNotification(minutes);
        });
        
        // cleanup: 타이머 정리
        return () => {
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current = [];
        };
    }, [enabled, isDocumentVisible]);
    
    /**
     * 타이머 리셋 (새 문서를 읽기 시작할 때 호출 가능)
     */
    const resetTimer = () => {
        // 기존 타이머 정리
        timersRef.current.forEach((timer) => clearTimeout(timer));
        timersRef.current = [];
        notifiedMinutesRef.current.clear();
        
        // 시작 시간 리셋
        startTimeRef.current = Date.now();
        
        // enabled이고 문서가 보이는 경우에만 타이머 재설정
        if (enabledRef.current && isDocumentVisibleRef.current) {
            NOTIFICATION_TIMES.forEach((minutes) => {
                const milliseconds = minutes * 60 * 1000;
                const timer = setTimeout(() => {
                    showTimerNotification(minutes).catch((error) => {
                        console.warn('[useTimerNotification] 알림 표시 실패:', error);
                    });
                    notifiedMinutesRef.current.add(minutes);
                }, milliseconds);
                
                timersRef.current.push(timer);
            });
        }
    };
    
    return {
        resetTimer,
    };
}

