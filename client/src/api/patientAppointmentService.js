import api from "./axios";

const DOCTOR_THEME = [
    { color: "#e0f2fe", accent: "#0284c7" },
    { color: "#ede9fe", accent: "#7c3aed" },
    { color: "#dcfce7", accent: "#16a34a" },
    { color: "#fff7ed", accent: "#ea580c" },
];

const WEEKDAY_LABELS = {
    SUN: "Sun",
    MON: "Mon",
    TUE: "Tue",
    WED: "Wed",
    THU: "Thu",
    FRI: "Fri",
    SAT: "Sat",
};

const toInitials = (name) => {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (!parts.length) {
        return "DR";
    }

    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
};

const inferFee = (department) => {
    const key = String(department || "").toLowerCase();
    if (key.includes("card")) {
        return 60;
    }
    if (key.includes("neuro") || key.includes("brain")) {
        return 55;
    }
    if (key.includes("pedia") || key.includes("child")) {
        return 45;
    }
    return 40;
};

const inferRating = (id) => {
    const base = 4.6;
    const delta = (Number(id) % 5) * 0.08;
    return Number((base + delta).toFixed(1));
};

const normalizeAvailableDayToken = (value) => {
    const normalized = String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[._-]/g, "")
        .replace(/[^A-Z]/g, "");

    switch (normalized) {
        case "SUN":
        case "SUNDAY":
            return "SUN";
        case "MON":
        case "MONDAY":
            return "MON";
        case "TUE":
        case "TUESDAY":
            return "TUE";
        case "WED":
        case "WEDNESDAY":
            return "WED";
        case "THU":
        case "THURSDAY":
            return "THU";
        case "FRI":
        case "FRIDAY":
            return "FRI";
        case "SAT":
        case "SATURDAY":
            return "SAT";
        default:
            return null;
    }
};

const parseAvailableDays = (rawValue) => {
    if (Array.isArray(rawValue)) {
        const uniqueDays = new Set();
        rawValue.forEach((day) => {
            const token = normalizeAvailableDayToken(day);
            if (token) {
                uniqueDays.add(token);
            }
        });
        return Array.from(uniqueDays);
    }

    if (typeof rawValue !== "string") {
        return [];
    }

    const trimmed = rawValue.trim();
    if (!trimmed) {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return parseAvailableDays(parsed);
        }
    } catch {
        // Keep raw string parsing as fallback for legacy stored values.
    }

    const uniqueDays = new Set();
    trimmed.split(/[\s,;|]+/).forEach((day) => {
        const token = normalizeAvailableDayToken(day);
        if (token) {
            uniqueDays.add(token);
        }
    });

    return Array.from(uniqueDays);
};

const normalizeDoctor = (doctor, index) => {
    const theme = DOCTOR_THEME[index % DOCTOR_THEME.length];
    const department = doctor.department || "General";
    const availableDays = parseAvailableDays(doctor.available_days);

    return {
        id: Number(doctor.id),
        name: doctor.name,
        specialty: doctor.specialization || "General Physician",
        department,
        clinic: `${department} Clinic`,
        rating: inferRating(doctor.id),
        fee: inferFee(department),
        avatar: toInitials(doctor.name),
        color: theme.color,
        accent: theme.accent,
        availableDays,
        availableDaysLabel:
            availableDays.length > 0
                ? availableDays.map((day) => WEEKDAY_LABELS[day]).join(", ")
                : "Every day",
    };
};

const normalizeAppointment = (item) => ({
    id: Number(item.id),
    doctorId: Number(item.doctor_id),
    doctorName: item.doctor_name || "Unknown Doctor",
    doctorSpecialization: item.doctor_specialization || "",
    doctorDepartment: item.doctor_department || "",
    appointmentDate: item.appointment_date,
    appointmentType: item.appointment_type || "in-person",
    status: item.status || "pending",
    summaryNote: item.summary_note || "",
});

const normalizeRoomAdmission = (item) => ({
    id: Number(item.id),
    roomId: Number(item.room_id),
    roomNumber: item.room_number || "",
    roomType: item.room_type || "General",
    floorNumber: Number(item.floor_number || 0),
    patientId: Number(item.patient_id),
    doctorId: Number(item.doctor_id),
    doctorName: item.doctor_name || "",
    doctorDepartment: item.doctor_department || "",
    doctorSpecialization: item.doctor_specialization || "",
    status: item.status || "admitted",
    admittedAt: item.admitted_at,
    expectedDischargeAt: item.expected_discharge_at,
    dischargedAt: item.discharged_at,
    admissionReason: item.admission_reason || "",
    admissionNotes: item.admission_notes || "",
    dischargeNotes: item.discharge_notes || "",
});

const normalizeRoomAdmissionStats = (item) => ({
    activeRoomAdmissions: Number(item.active_room_admissions || 0),
    totalRoomAdmissions: Number(item.total_room_admissions || 0),
});

const patientAppointmentService = {
    getDoctors: async ({ search = "", department = "" } = {}) => {
        const response = await api.get("/patient/doctors", {
            params: {
                search: search || undefined,
                department: department || undefined,
            },
        });

        const doctors = response.data?.doctors || [];
        return doctors.map(normalizeDoctor);
    },

    createAppointment: async ({ doctorId, appointmentType, appointmentDate }) => {
        const response = await api.post("/patient/appointments", {
            doctor_id: doctorId,
            appointment_type: appointmentType,
            appointment_date: appointmentDate,
        });

        return normalizeAppointment(response.data?.appointment || {});
    },

    getMyAppointments: async () => {
        const response = await api.get("/patient/appointments");
        const appointments = response.data?.appointments || [];

        return appointments.map(normalizeAppointment);
    },

    getUpcomingAppointments: async ({ limit = 5 } = {}) => {
        const response = await api.get("/patient/appointments/upcoming", {
            params: {
                limit,
            },
        });

        const appointments = response.data?.appointments || [];

        return appointments.map(normalizeAppointment);
    },

    getRoomAdmissionsSummary: async ({ limit = 5 } = {}) => {
        const response = await api.get("/patient/room-admissions/summary", {
            params: {
                limit,
            },
        });

        return {
            stats: normalizeRoomAdmissionStats(response.data?.stats || {}),
            roomAdmissions: (response.data?.room_admissions || []).map(
                normalizeRoomAdmission,
            ),
        };
    },

    getRoomAdmissionDetails: async (admissionId) => {
        const response = await api.get(`/patient/room-admissions/${admissionId}`);
        return normalizeRoomAdmission(response.data?.room_admission || {});
    },

    getRecentHistory: async ({ limit = 5 } = {}) => {
        const response = await api.get("/patient/appointments/history", {
            params: {
                limit,
            },
        });

        const appointments = response.data?.appointments || [];

        return appointments.map(normalizeAppointment);
    },

    getAppointmentDetails: async (appointmentId) => {
        const response = await api.get(`/patient/appointments/${appointmentId}`);

        return normalizeAppointment(response.data?.appointment || {});
    },

    getAppointmentSummary: async (appointmentId) => {
        const response = await api.get(
            `/patient/appointments/${appointmentId}/summary`,
        );

        return normalizeAppointment(response.data?.appointment || {});
    },

    cancelAppointment: async (appointmentId) => {
        const response = await api.patch(
            `/patient/appointments/${appointmentId}/cancel`,
        );

        return normalizeAppointment(response.data?.appointment || {});
    },
};

export default patientAppointmentService;
