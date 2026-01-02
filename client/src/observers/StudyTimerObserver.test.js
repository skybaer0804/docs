import { StudyTimerObserver } from './StudyTimerObserver';

// Mocking dependencies
global.Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(),
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    loop: false
}));

global.navigator.mediaSession = {
    metadata: null,
    setActionHandler: jest.fn()
};

const mockService = {
    createSession: jest.fn().mockResolvedValue({ id: 'test-session-id' }),
    endSession: jest.fn().mockResolvedValue({})
};

const mockStorage = {
    saveActiveSession: jest.fn(),
    clearActiveSession: jest.fn(),
    savePendingSync: jest.fn()
};

describe('StudyTimerObserver', () => {
    let observer;

    beforeEach(() => {
        jest.clearAllMocks();
        observer = new StudyTimerObserver(mockService, mockStorage);
    });

    it('should initialize with idle status', () => {
        expect(observer.status).toBe('idle');
        expect(observer.sessionId).toBeNull();
    });

    it('should start recording and set session id', async () => {
        await observer.start();
        expect(observer.status).toBe('recording');
        expect(observer.sessionId).toBe('test-session-id');
        expect(global.Audio).toHaveBeenCalled();
        expect(mockService.createSession).toHaveBeenCalled();
        expect(mockStorage.saveActiveSession).toHaveBeenCalled();
    });

    it('should pause recording', async () => {
        await observer.start();
        observer.pause();
        expect(observer.status).toBe('paused');
        expect(observer.audio.pause).toHaveBeenCalled();
    });

    it('should end recording and calculate pure duration', async () => {
        // Mocking Date.now to control duration
        const now = Date.now();
        const startSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
        await observer.start();
        
        startSpy.mockReturnValue(now + 5000); // 5 seconds later
        await observer.end();
        
        expect(observer.status).toBe('idle');
        expect(mockService.endSession).toHaveBeenCalledWith('test-session-id', expect.objectContaining({
            pureDuration: 5
        }));
        expect(mockStorage.clearActiveSession).toHaveBeenCalled();
        
        startSpy.mockRestore();
    });
});

