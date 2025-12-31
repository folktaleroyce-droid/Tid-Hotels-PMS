
import React, { useState, useEffect, useRef } from 'react';
import type { SyncLogEntry } from '../../types.ts';

// Icons for different notification levels
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const WarnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const NOTIFICATION_THEME = {
    info: { icon: <InfoIcon />, bg: 'bg-sky-500', text: 'text-white' },
    success: { icon: <SuccessIcon />, bg: 'bg-green-500', text: 'text-white' },
    warn: { icon: <WarnIcon />, bg: 'bg-amber-500', text: 'text-white' },
    error: { icon: <ErrorIcon />, bg: 'bg-red-500', text: 'text-white' },
};

interface NotificationToastProps {
    notification: SyncLogEntry & { id: number };
    onClose: (id: number) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
    const theme = NOTIFICATION_THEME[notification.level];

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(notification.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div
            className={`flex items-start p-4 mb-4 rounded-lg shadow-lg w-full max-w-sm transform transition-all duration-300 ease-in-out animate-fade-in-right ${theme.bg} ${theme.text}`}
            role="alert"
        >
            <div className="flex-shrink-0">{theme.icon}</div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
                type="button"
                onClick={() => onClose(notification.id)}
                className="ml-4 -mr-1 -mt-1 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
            >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

interface NotificationContainerProps {
    logs: SyncLogEntry[];
}

type Notification = SyncLogEntry & { id: number };

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ logs }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const prevLogsRef = useRef<SyncLogEntry[]>([]);

    useEffect(() => {
        // A new log is added to the beginning of the `logs` array.
        if (logs.length > 0 && (prevLogsRef.current.length === 0 || logs[0].timestamp !== prevLogsRef.current[0]?.timestamp || logs[0].message !== prevLogsRef.current[0]?.message)) {
            const newLog = logs[0];
            setNotifications(prev => [{ ...newLog, id: Date.now() }, ...prev]);
        }
        prevLogsRef.current = logs;
    }, [logs]);

    const handleClose = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="fixed top-20 right-4 z-50 w-full max-w-sm">
            {notifications.map(notification => (
                <NotificationToast key={notification.id} notification={notification} onClose={handleClose} />
            ))}
        </div>
    );
};
