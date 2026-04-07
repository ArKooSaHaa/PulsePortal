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

const adminAppointmentService = {
    getAppointments: async ({ status = "" } = {}) => {
        const response = await api.get("/admin/appointments", {
            params: {
                status: status || undefined,
            },
        });

        const appointments = response.data?.appointments || [];
        return appointments.map(normalizeAppointment);
    },

    updateAppointmentStatus: async ({ appointmentId, status }) => {
        const response = await api.patch(
            `/admin/appointments/${appointmentId}/status`,
            {
                status,
            },
        );

        return normalizeAppointment(response.data?.appointment || {});
    },
};

export default adminAppointmentService;