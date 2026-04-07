import api from "./axios";

const DOCTOR_THEME = [
    { color: "#e0f2fe", accent: "#0284c7" },
    { color: "#ede9fe", accent: "#7c3aed" },
    { color: "#dcfce7", accent: "#16a34a" },
    { color: "#fff7ed", accent: "#ea580c" },
];

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

const normalizeDoctor = (doctor, index) => {
    const theme = DOCTOR_THEME[index % DOCTOR_THEME.length];
    const department = doctor.department || "General";

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

    getRecentHistory: async ({ limit = 5 } = {}) => {
        const response = await api.get("/patient/appointments/history", {
            params: {
                limit,
            },
        });

        const appointments = response.data?.appointments || [];

        return appointments.map(normalizeAppointment);
    },
};

export default patientAppointmentService;
