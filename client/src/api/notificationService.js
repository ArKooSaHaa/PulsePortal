import api from "./axios";

const ENDPOINTS_BY_ROLE = {
    patient: "/patient/notifications",
    doctor: "/doctor/notifications",
    admin: "/admin/notifications",
};

const normalizeNotification = (item, index) => ({
    id:
        item.notification_key ||
        `notification-${item.notification_type || "general"}-${index}`,
    type: item.notification_type || "general",
    title: item.title || "Notification",
    message: item.message || "",
    createdAt: item.created_at || null,
    targetPath: item.target_path || "",
});

const notificationService = {
    getNotifications: async (role, { limit = 8 } = {}) => {
        const endpoint = ENDPOINTS_BY_ROLE[role];

        if (!endpoint) {
            return [];
        }

        const response = await api.get(endpoint, {
            params: {
                limit,
            },
        });

        const notifications = response.data?.notifications || [];

        return notifications.map(normalizeNotification);
    },
};

export default notificationService;
