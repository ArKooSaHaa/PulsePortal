import api from "./axios";

const normalizeAdmission = (item) => ({
    id: Number(item.id),
    roomId: Number(item.room_id),
    roomNumber: item.room_number || "",
    roomType: item.room_type || "General",
    floorNumber: Number(item.floor_number || 0),
    patientId: Number(item.patient_id),
    patientName: item.patient_name || "Unknown Patient",
    patientEmail: item.patient_email || "",
    doctorId: item.doctor_id !== null && item.doctor_id !== undefined ? Number(item.doctor_id) : null,
    doctorName: item.doctor_name || "Not assigned",
    doctorDepartment: item.doctor_department || "",
    status: item.status || "admitted",
    admissionReason: item.admission_reason || "",
    admissionNotes: item.admission_notes || "",
    dischargeNotes: item.discharge_notes || "",
    admittedAt: item.admitted_at,
    expectedDischargeAt: item.expected_discharge_at,
    dischargedAt: item.discharged_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
});

const normalizeRoom = (item) => ({
    id: Number(item.id),
    roomNumber: item.room_number || "",
    roomType: item.room_type || "General",
    floorNumber: Number(item.floor_number || 0),
    status: item.status || "available",
});

const normalizeDoctor = (item) => ({
    id: Number(item.id),
    name: item.name || "Unknown Doctor",
    department: item.department || "",
    specialization: item.specialization || "",
});

const normalizePatient = (item) => ({
    id: Number(item.id),
    name: item.name || "Unknown Patient",
    email: item.email || "",
});

const normalizeStats = (item) => ({
    totalRooms: Number(item.total_rooms || 0),
    occupiedRooms: Number(item.occupied_rooms || 0),
    availableRooms: Number(item.available_rooms || 0),
    activeAdmissions: Number(item.active_admissions || 0),
    dischargedAdmissions: Number(item.discharged_admissions || 0),
    totalAdmissions: Number(item.total_admissions || 0),
});

const adminRoomAdmissionService = {
    getAdmissions: async ({ status = "" } = {}) => {
        const response = await api.get("/admin/room-admissions", {
            params: {
                status: status || undefined,
            },
        });

        const admissions = response.data?.admissions || [];
        return admissions.map(normalizeAdmission);
    },

    getLookupData: async () => {
        const response = await api.get("/admin/room-admissions/lookups");

        return {
            patients: (response.data?.patients || []).map(normalizePatient),
            doctors: (response.data?.doctors || []).map(normalizeDoctor),
            availableRooms: (response.data?.available_rooms || []).map(normalizeRoom),
        };
    },

    createAdmission: async ({
        patientId,
        roomId,
        doctorId,
        admissionReason,
        admissionNotes,
        admittedAt,
        expectedDischargeAt,
    }) => {
        const response = await api.post("/admin/room-admissions", {
            patient_id: patientId,
            room_id: roomId,
            doctor_id: doctorId || undefined,
            admission_reason: admissionReason || undefined,
            admission_notes: admissionNotes || undefined,
            admitted_at: admittedAt || undefined,
            expected_discharge_at: expectedDischargeAt || undefined,
        });

        return normalizeAdmission(response.data?.admission || {});
    },

    dischargeAdmission: async ({ admissionId, dischargeNotes }) => {
        const response = await api.patch(
            `/admin/room-admissions/${admissionId}/discharge`,
            {
                discharge_notes: dischargeNotes || undefined,
            },
        );

        return normalizeAdmission(response.data?.admission || {});
    },

    getDashboardSummary: async ({ limit = 5 } = {}) => {
        const response = await api.get("/admin/room-admissions/dashboard-summary", {
            params: {
                limit,
            },
        });

        return {
            stats: normalizeStats(response.data?.stats || {}),
            recentAdmissions: (response.data?.recent_admissions || []).map(
                normalizeAdmission,
            ),
        };
    },
};

export default adminRoomAdmissionService;
