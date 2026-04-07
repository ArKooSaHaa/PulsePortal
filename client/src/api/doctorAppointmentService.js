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
};

export default doctorAppointmentService;