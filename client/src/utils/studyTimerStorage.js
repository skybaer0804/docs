/**
 * studyTimerStorage
 * 순공부 시간 측정 데이터를 localStorage에 백업하고 복구하는 유틸리티
 */

const ACTIVE_SESSION_KEY = 'study_timer_active_session';
const PENDING_SYNC_KEY = 'study_timer_pending_sync';

export const studyTimerStorage = {
    /**
     * 현재 진행 중인 세션 정보 저장
     */
    saveActiveSession(data) {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({
            ...data,
            savedAt: Date.now()
        }));
    },

    /**
     * 현재 진행 중인 세션 정보 조회
     */
    getActiveSession() {
        const data = localStorage.getItem(ACTIVE_SESSION_KEY);
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to parse active session', e);
            return null;
        }
    },

    /**
     * 활성 세션 정보 삭제
     */
    clearActiveSession() {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
    },

    /**
     * 서버 전송에 실패한 종료 기록 저장
     */
    savePendingSync(data) {
        const pending = this.getPendingSync();
        pending.push({
            ...data,
            failedAt: Date.now()
        });
        localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    },

    /**
     * 미전송 종료 기록 목록 조회
     */
    getPendingSync() {
        const data = localStorage.getItem(PENDING_SYNC_KEY);
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to parse pending sync', e);
            return [];
        }
    },

    /**
     * 미전송 데이터 동기화 시도
     * @param {Object} service - studyTimerService 인스턴스
     */
    async syncPendingData(service) {
        const pending = this.getPendingSync();
        if (pending.length === 0) return;

        console.log(`StudyTimer: Attempting to sync ${pending.length} pending sessions...`);
        const remaining = [];
        
        for (const session of pending) {
            try {
                await service.endSession(session.sessionId, {
                    end_at: session.end_at,
                    pure_duration: session.pure_duration
                });
            } catch (err) {
                console.error(`StudyTimer: Sync failed for session ${session.sessionId}`, err);
                remaining.push(session);
            }
        }

        if (remaining.length === 0) {
            localStorage.removeItem(PENDING_SYNC_KEY);
        } else {
            localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining));
        }
    }
};

