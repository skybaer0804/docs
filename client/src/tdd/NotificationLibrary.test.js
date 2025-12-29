/**
 * @jest-environment jsdom
 */
import { NotificationLibrary } from './NotificationLibrary';

describe('NotificationLibrary', () => {
    const originalNotification = window.Notification;
    let notificationLib;

    beforeEach(() => {
        notificationLib = new NotificationLibrary();
        // 기본적으로 지원되는 환경으로 설정
        window.Notification = jest.fn();
        Object.defineProperty(window.Notification, 'permission', {
            value: 'default',
            writable: true,
        });
        window.Notification.requestPermission = jest.fn().mockResolvedValue('granted');
    });

    afterEach(() => {
        window.Notification = originalNotification;
        jest.clearAllMocks();
    });

    describe('isSupported', () => {
        it('should return true when Notification is available in window', () => {
            expect(notificationLib.isSupported()).toBe(true);
        });

        it('should return false when Notification is undefined', () => {
            delete window.Notification;
            expect(notificationLib.isSupported()).toBe(false);
        });
    });

    describe('getPermission', () => {
        it('should return "denied" if not supported', () => {
            delete window.Notification;
            expect(notificationLib.getPermission()).toBe('denied');
        });

        it('should return current permission status', () => {
            window.Notification.permission = 'granted';
            expect(notificationLib.getPermission()).toBe('granted');

            window.Notification.permission = 'denied';
            expect(notificationLib.getPermission()).toBe('denied');
        });
    });

    describe('requestPermission', () => {
        it('should return "denied" if not supported', async () => {
            delete window.Notification;
            const result = await notificationLib.requestPermission();
            expect(result).toBe('denied');
        });

        it('should return existing permission if already granted', async () => {
            window.Notification.permission = 'granted';
            const result = await notificationLib.requestPermission();

            expect(result).toBe('granted');
            expect(window.Notification.requestPermission).not.toHaveBeenCalled();
        });

        it('should return existing permission if already denied', async () => {
            window.Notification.permission = 'denied';
            const result = await notificationLib.requestPermission();

            expect(result).toBe('denied');
            expect(window.Notification.requestPermission).not.toHaveBeenCalled();
        });

        it('should call requestPermission if permission is default', async () => {
            window.Notification.permission = 'default';
            const result = await notificationLib.requestPermission();

            expect(window.Notification.requestPermission).toHaveBeenCalled();
            expect(result).toBe('granted');
        });
    });

    describe('show', () => {
        it('should not create notification if permission is not granted', () => {
            window.Notification.permission = 'denied';
            const notification = notificationLib.show('Test', {});

            expect(notification).toBeNull();
            expect(window.Notification).not.toHaveBeenCalled();
        });

        it('should create notification with correct arguments when granted', () => {
            window.Notification.permission = 'granted';
            const title = 'Test Title';
            const options = { body: 'Test Body' };

            notificationLib.show(title, options);

            expect(window.Notification).toHaveBeenCalledWith(title, expect.objectContaining(options));
        });

        it('should apply default options', () => {
            window.Notification.permission = 'granted';
            notificationLib.show('Test');

            expect(window.Notification).toHaveBeenCalledWith(
                'Test',
                expect.objectContaining({
                    silent: true, // Default option check
                })
            );
        });
    });
});
