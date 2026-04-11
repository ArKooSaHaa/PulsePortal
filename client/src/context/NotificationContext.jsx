import React, { createContext, useContext, useEffect, useState } from 'react';
import echo from '../utils/echo';
import authService from '../api/authService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Get the user once on mount/reload or whenever authService could change. 
    // Usually, wrapping it in state or reading directly is fine in simple cases.
    const user = authService.getCurrentUser();

    useEffect(() => {
        if (!user || !user.id) return;

        const channel = echo.private(`user.${user.id}`);

        // Listen for new appointment request (for doctors)
        channel.listen('.appointment.requested', (data) => {
            addNotification({
                id: Date.now(),
                title: 'New Appointment',
                message: data.message,
                time: new Date().toLocaleTimeString(),
                type: 'request'
            });
        });

        // Listen for status updates (for patients)
        channel.listen('.appointment.status.updated', (data) => {
            addNotification({
                id: Date.now(),
                title: 'Appointment Update',
                message: data.message,
                time: new Date().toLocaleTimeString(),
                type: 'status'
            });
        });

        return () => {
            channel.stopListening('.appointment.requested');
            channel.stopListening('.appointment.status.updated');
        };
    }, [user?.id]);

    const addNotification = (notif) => {
        setNotifications(prev => [notif, ...prev].slice(0, 10)); // Keep last 10
        setUnreadCount(prev => prev + 1);
        
        // Browser Notification (optional)
        if (Notification.permission === 'granted') {
            new Notification(notif.title, { body: notif.message });
        }
    };

    const markAsRead = () => {
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);