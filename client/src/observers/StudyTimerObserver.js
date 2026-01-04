import { createStudySession, endStudySession, fetchActiveStudySession } from '../utils/api';
import { studyTimerStorage } from '../utils/studyTimerStorage';

/**
 * StudyTimerObserver
 * 순공부 시간 측정 로직을 담당하는 싱글톤 클래스
 */
export class StudyTimerObserver {
    constructor() {
        this.service = {
            createSession: createStudySession,
            endSession: endStudySession,
            fetchActive: fetchActiveStudySession
        };
        this.storage = studyTimerStorage;
        this.sessionId = null;
        this.startTime = null;
        this.pausedDuration = 0;
        this.status = 'idle'; // 'idle' | 'recording' | 'paused'
        this.listeners = new Set();
        
        // Visibility Change 감지 (백그라운드 복귀 대응)
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.notify(); // UI 갱신 유도
                }
            });
        }
    }

    /**
     * 서버의 활성 세션과 동기화
     */
    async syncWithServer() {
        try {
            const activeSession = await this.service.fetchActive();
            if (activeSession) {
                this.sessionId = activeSession.id;
                this.startTime = new Date(activeSession.start_at).getTime();
                this.status = activeSession.status || 'recording';
                // 서버 데이터 기반으로 로컬 상태 복구
                this.notify();
            } else {
                // 서버에 활성 세션이 없으면 로컬도 정리
                if (this.status !== 'idle') {
                    this.cleanup();
                }
            }
        } catch (err) {
            console.error('StudyTimer: Sync with server failed', err);
        }
    }

    subscribe(callback) {
        this.listeners.add(callback);
        // 첫 구독 시 서버 동기화 시도
        if (this.listeners.size === 1) {
            this.syncWithServer();
        }
        return () => this.listeners.delete(callback);
    }

    notify() {
        const state = this.getState();
        this.listeners.forEach(callback => callback(state));
    }

    getState() {
        const now = Date.now();
        let elapsedMs = 0;
        
        if (this.status === 'recording' && this.startTime) {
            elapsedMs = now - this.startTime - this.pausedDuration;
        } else if (this.status === 'paused' && this.startTime) {
            elapsedMs = (this.lastPausedAt || now) - this.startTime - this.pausedDuration;
        }
        
        return {
            status: this.status,
            sessionId: this.sessionId,
            elapsedMs: Math.max(0, elapsedMs)
        };
    }

    async start() {
        if (this.status === 'recording') return;

        try {
            // 1. 상태 업데이트
            if (this.status === 'idle') {
                this.startTime = Date.now();
                this.pausedDuration = 0;
                
                // DB 세션 생성
                if (this.service) {
                    const response = await this.service.createSession();
                    this.sessionId = response.id;
                }
            } else if (this.status === 'paused') {
                // 일시정지 해제 시, 멈춰있던 시간을 누적
                this.pausedDuration += (Date.now() - this.lastPausedAt);
            }

            this.status = 'recording';
            
            // 2. 로컬 백업
            if (this.storage) {
                this.storage.saveActiveSession({
                    sessionId: this.sessionId,
                    startTime: this.startTime,
                    pausedDuration: this.pausedDuration,
                    status: this.status
                });
            }

            this.notify();
        } catch (err) {
            console.error('StudyTimer: Failed to start', err);
        }
    }

    pause() {
        if (this.status !== 'recording') return;

        this.status = 'paused';
        this.lastPausedAt = Date.now();
        
        if (this.storage) {
            this.storage.saveActiveSession({
                sessionId: this.sessionId,
                startTime: this.startTime,
                pausedDuration: this.pausedDuration,
                status: this.status,
                lastPausedAt: this.lastPausedAt
            });
        }
        
        this.notify();
    }

    async end() {
        if (this.status === 'idle') return;

        const endTime = Date.now();
        const finalPausedDuration = this.status === 'paused' 
            ? this.pausedDuration + (endTime - this.lastPausedAt)
            : this.pausedDuration;
            
        const pureDuration = Math.floor((endTime - this.startTime - finalPausedDuration) / 1000);

        try {
            if (this.service && this.sessionId) {
                await this.service.endSession(this.sessionId, {
                    end_at: new Date(endTime).toISOString(),
                    pure_duration: Math.max(0, pureDuration)
                });
            }
            if (this.storage) {
                this.storage.clearActiveSession();
            }
        } catch (err) {
            console.error('StudyTimer: Failed to end session on server', err);
            if (this.storage) {
                this.storage.savePendingSync({
                    sessionId: this.sessionId,
                    end_at: new Date(endTime).toISOString(),
                    pure_duration: Math.max(0, pureDuration)
                });
            }
        } finally {
            this.cleanup();
        }
    }

    cleanup() {
        this.status = 'idle';
        this.sessionId = null;
        this.startTime = null;
        this.pausedDuration = 0;
        this.lastPausedAt = null;
        
        this.notify();
    }
}

export const studyTimerObserver = new StudyTimerObserver();

