import api from "./axios";

const normalizeAppointment = (item) => ({
    id: Number(item.id),
    patientId: Number(item.patient_id),
    doctorId: Number(item.doctor_id),
    patientName: item.patient_name || "Unknown Patient",
    patientEmail: item.patient_email || "",
    appointmentDate: item.appointment_date,
    appointmentType: item.appointment_type || "in-person",
    status: item.status || "pending",
});

const normalizeRoomAdmission = (item) => ({
    id: Number(item.id),
    roomId: Number(item.room_id),
    roomNumber: item.room_number || "",
    roomType: item.room_type || "General",
    floorNumber: Number(item.floor_number || 0),
    patientId: Number(item.patient_id),
    patientName: item.patient_name || "Unknown Patient",
    patientEmail: item.patient_email || "",
    doctorId: Number(item.doctor_id),
    doctorName: item.doctor_name || "",
    doctorDepartment: item.doctor_department || "",
    status: item.status || "admitted",
    admittedAt: item.admitted_at,
    expectedDischargeAt: item.expected_discharge_at,
    dischargedAt: item.discharged_at,
    admissionReason: item.admission_reason || "",
    admissionNotes: item.admission_notes || "",
    dischargeNotes: item.discharge_notes || "",
    createdAt: item.created_at,
    updatedAt: item.updated_at,
});

const normalizeRoomAdmissionStats = (item) => ({
    activeRoomAdmissions: Number(item.active_room_admissions || 0),
    totalRoomAdmissions: Number(item.total_room_admissions || 0),
});

const doctorAppointmentService = {
    getMyAppointments: async ({ status = "", scope = "all" } = {}) => {
        const normalizedScope = ["upcoming", "today"].includes(scope)
            ? scope
            : undefined;

        const response = await api.get("/doctor/appointments", {
            params: {
                status: status || undefined,
                scope: normalizedScope,
            },
        });

        const appointments = response.data?.appointments || [];
        return appointments.map(normalizeAppointment);
    },

    updateAppointmentStatus: async ({ appointmentId, status }) => {
        const response = await api.patch(
            `/doctor/appointments/${appointmentId}/status`,
            {
                status,
            },
        );

        return normalizeAppointment(response.data?.appointment || {});
    },

    getRoomAdmissionsSummary: async ({ limit = 5 } = {}) => {
        const response = await api.get("/doctor/room-admissions/summary", {
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
        const response = await api.get(`/doctor/room-admissions/${admissionId}`);
        return normalizeRoomAdmission(response.data?.room_admission || {});
    },
};

export default doctorAppointmentService;