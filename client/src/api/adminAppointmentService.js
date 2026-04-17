import api from "./axios";

const normalizeAppointment = (item) => ({
    id: Number(item.id),
    patientId: Number(item.patient_id),
    doctorId: Number(item.doctor_id),
    patientName: item.patient_name || "Unknown Patient",
    patientEmail: item.patient_email || "",
    doctorName: item.doctor_name || "Unknown Doctor",
    doctorDepartment: item.doctor_department || "",
    doctorSpecialization: item.doctor_specialization || "",
    appointmentDate: item.appointment_date,
    appointmentType: item.appointment_type || "in-person",
    status: item.status || "pending",
});

const normalizeStats = (item) => ({
    appointmentsToday: Number(item.appointments_today || 0),
    upcomingAppointments: Number(item.upcoming_appointments || 0),
    totalAppointments: Number(item.total_appointments || 0),
    totalDoctors: Number(item.total_doctors || 0),
    totalPatients: Number(item.total_patients || 0),
});

const defaultStats = {
    appointmentsToday: 0,
    upcomingAppointments: 0,
    totalAppointments: 0,
    totalDoctors: 0,
    totalPatients: 0,
};

const getNestedPayload = (responseData) => {
    return responseData?.data && typeof responseData.data === "object"
        ? responseData.data
        : null;
};

const pickArray = (responseData, key) => {
    const nested = getNestedPayload(responseData);

    if (Array.isArray(responseData?.[key])) {
        return responseData[key];
    }

    if (Array.isArray(nested?.[key])) {
        return nested[key];
    }

    return [];
};

const pickObject = (responseData, key) => {
    const nested = getNestedPayload(responseData);

    if (responseData?.[key] && typeof responseData[key] === "object") {
        return responseData[key];
    }

    if (nested?.[key] && typeof nested[key] === "object") {
        return nested[key];
    }

    return {};
};

const isRouteMissingError = (error) => {
    const statusCode = error?.response?.status;
    const message = String(error?.response?.data?.message || "").toLowerCase();

    return (
        [404, 405].includes(statusCode) ||
        (message.includes("route") && message.includes("could not be found"))
    );
};

const normalizePositiveLimit = (value, fallback = 5) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
};

const isSameLocalDate = (first, second) => {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
};

const toTimestamp = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const deriveStatsFromAppointments = (appointments) => {
    if (!Array.isArray(appointments) || appointments.length === 0) {
        return defaultStats;
    }

    const now = new Date();
    const uniqueDoctors = new Set();
    const uniquePatients = new Set();

    let appointmentsToday = 0;
    let upcomingAppointments = 0;

    appointments.forEach((item) => {
        if (Number.isInteger(item.doctorId) && item.doctorId > 0) {
            uniqueDoctors.add(item.doctorId);
        }

        if (Number.isInteger(item.patientId) && item.patientId > 0) {
            uniquePatients.add(item.patientId);
        }

        const appointmentDate = new Date(item.appointmentDate);
        if (Number.isNaN(appointmentDate.getTime())) {
            return;
        }

        if (isSameLocalDate(appointmentDate, now)) {
            appointmentsToday += 1;
        }

        if (appointmentDate.getTime() > now.getTime()) {
            upcomingAppointments += 1;
        }
    });

    return {
        appointmentsToday,
        upcomingAppointments,
        totalAppointments: appointments.length,
        totalDoctors: uniqueDoctors.size,
        totalPatients: uniquePatients.size,
    };
};

const adminAppointmentService = {
    getAppointments: async ({ status = "" } = {}) => {
        const response = await api.get("/admin/appointments", {
            params: {
                status: status || undefined,
            },
        });

        const appointments = pickArray(response.data, "appointments");
        return appointments.map(normalizeAppointment);
    },

    updateAppointmentStatus: async ({ appointmentId, status }) => {
        const response = await api.patch(
            `/admin/appointments/${appointmentId}/status`,
            {
                status,
            },
        );

        return normalizeAppointment(pickObject(response.data, "appointment"));
    },

    getDashboardSummary: async ({ limit = 5 } = {}) => {
        const normalizedLimit = normalizePositiveLimit(limit);

        try {
            const response = await api.get("/admin/dashboard-summary", {
                params: {
                    limit: normalizedLimit,
                },
            });

            return {
                stats: normalizeStats(pickObject(response.data, "stats")),
                recentAppointments: pickArray(response.data, "recent_appointments")
                    .map(normalizeAppointment)
                    .slice(0, normalizedLimit),
            };
        } catch (error) {
            if (!isRouteMissingError(error)) {
                throw error;
            }

            const appointments = await adminAppointmentService.getAppointments();
            const sortedRecent = [...appointments]
                .sort((a, b) => toTimestamp(b.appointmentDate) - toTimestamp(a.appointmentDate))
                .slice(0, normalizedLimit);

            return {
                stats: deriveStatsFromAppointments(appointments),
                recentAppointments: sortedRecent,
            };
        }
    },
};

export default adminAppointmentService;