import { createStudySession, endStudySession } from '../utils/api';
import { studyTimerStorage } from '../utils/studyTimerStorage';

// 1초 무음 WAV 데이터 URI (파일 미존재 시 대비)
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * StudyTimerObserver
 * 순공부 시간 측정 로직을 담당하는 싱글톤 클래스
 */
export class StudyTimerObserver {
    constructor() {
        this.service = {
            createSession: createStudySession,
            endSession: endStudySession
        };
        this.storage = studyTimerStorage;
        this.audio = null;
        this.sessionId = null;
        this.startTime = null;
        this.pausedDuration = 0;
        this.status = 'idle'; // 'idle' | 'recording' | 'paused'
        this.listeners = new Set();
        this.handleAudioInterrupt = this.handleAudioInterrupt.bind(this);
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notify() {
        const state = this.getState();
        this.listeners.forEach(callback => callback(state));
    }

    getState() {
        const now = Date.now();
        let elapsedMs = 0;
        if (this.status === 'recording') {
            elapsedMs = now - this.startTime - this.pausedDuration;
        } else if (this.status === 'paused') {
            // 일시정지 상태에서는 멈춘 시점의 경과 시간 유지
            elapsedMs = this.lastPausedAt - this.startTime - this.pausedDuration;
        }
        return {
            status: this.status,
            sessionId: this.sessionId,
            elapsedMs: Math.max(0, elapsedMs)
        };
    }

    handleAudioInterrupt() {
        if (this.status === 'recording') {
            console.warn('StudyTimer: Audio interrupted, pausing...');
            this.pause();
        }
    }

    async start() {
        if (this.status === 'recording') return;

        // 1. 오디오 설정 (PWA 백그라운드 유지용)
        if (!this.audio) {
            // 외부 파일 대신 내장된 무음 데이터 사용
            this.audio = new Audio(SILENT_AUDIO_URI);
            this.audio.loop = true;
            this.audio.addEventListener('pause', this.handleAudioInterrupt);
        }

        try {
            await this.audio.play();
            
            // 2. Media Session 설정
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: '순공부 시간 측정 중',
                    artist: 'Docs App',
                    artwork: [
                        { src: '/assets/icon.svg', sizes: '512x512', type: 'image/svg+xml' }
                    ]
                });
                navigator.mediaSession.setActionHandler('play', () => this.start());
                navigator.mediaSession.setActionHandler('pause', () => this.pause());
                navigator.mediaSession.setActionHandler('stop', () => this.end());
            }

            // 3. 상태 업데이트
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
            
            // 4. 로컬 백업
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
        this.audio?.pause();
        
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
        if (this.audio) {
            this.audio.removeEventListener('pause', this.handleAudioInterrupt);
            this.audio.pause();
            this.audio = null;
        }
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
        }

        this.status = 'idle';
        this.sessionId = null;
        this.startTime = null;
        this.pausedDuration = 0;
        this.lastPausedAt = null;
        
        this.notify();
    }
}

// 실제 앱에서 사용할 싱글톤 인스턴스는 Context 등에서 주입하여 생성하거나 
// 여기서 기본 인스턴스를 내보낼 수 있습니다.
// 여기서는 기본 인스턴스를 내보내되, 의존성은 나중에 설정할 수 있도록 합니다.
export const studyTimerObserver = new StudyTimerObserver();

