import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEcho } from '../utils/echo';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const channelRef = useRef(null);
    const tokenRef = useRef(null);

    // Build a notification object with a role-aware navigation link
    const buildNotification = useCallback((data, type) => {
        const user = (() => {
            try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
        })();

        const role = user?.role || 'patient';

        let link = `/${role}/appointments`;
        if (role === 'admin') link = '/admin/all-appointments';

        return {
            id: Date.now() + Math.random(),          // ensure uniqueness
            title: type === 'request' ? 'New Appointment Request' : 'Appointment Updated',
            message: data.message,
            time: new Date().toLocaleTimeString(),
            type,
            appointmentId: data.id || null,
            link,
        };
    }, []);

    const addNotification = useCallback((notif) => {
        setNotifications(prev => [notif, ...prev].slice(0, 20));
        setUnreadCount(prev => prev + 1);

        // Native browser notification (if user granted permission)
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new Notification(notif.title, { body: notif.message });
        }
    }, []);

    // Subscribe / re-subscribe whenever the stored token changes
    const subscribe = useCallback(() => {
        const token = localStorage.getItem('token');
        const userRaw = localStorage.getItem('user');

        if (!token || !userRaw) return;

        // Don't re-subscribe with the same token
        if (token === tokenRef.current && channelRef.current) return;

        // Tear down existing subscription
        if (channelRef.current) {
            try {
                channelRef.current.stopListening('.appointment.requested');
                channelRef.current.stopListening('.appointment.status.updated');
            } catch (_) {}
            channelRef.current = null;
        }

        const user = (() => { try { return JSON.parse(userRaw); } catch { return null; } })();
        if (!user?.id) return;

        tokenRef.current = token;
        const echo = getEcho(token);
        const channel = echo.private(`user.${user.id}`);
        channelRef.current = channel;

        channel.listen('.appointment.requested', (data) => {
            addNotification(buildNotification(data, 'request'));
        });

        channel.listen('.appointment.status.updated', (data) => {
            addNotification(buildNotification(data, 'status'));
        });
    }, [addNotification, buildNotification]);

    // Run on mount, and re-check periodically to catch logins that happen after mount
    useEffect(() => {
        subscribe();

        // Poll every 2 s — lightweight, just checks if the token changed
        const interval = setInterval(subscribe, 2000);

        return () => {
            clearInterval(interval);
            if (channelRef.current) {
                try {
                    channelRef.current.stopListening('.appointment.requested');
                    channelRef.current.stopListening('.appointment.status.updated');
                } catch (_) {}
            }
        };
    }, [subscribe]);

    const markAsRead = useCallback(() => setUnreadCount(0), []);

    const handleNotificationClick = useCallback((notif) => {
        if (notif.link) {
            navigate(notif.link, { state: { highlight: notif.appointmentId } });
        }
    }, [navigate]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            handleNotificationClick,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
