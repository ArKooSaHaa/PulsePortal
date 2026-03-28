import api from "./axios";

const appointmentService = {
    // Fetch all available doctors
    getDoctors: async () => {
        const response = await api.get("/doctor/available");
        return response.data.data;
    },

    // Patient books an appointment
    bookAppointment: async (data) => {
        const response = await api.post("/patient/appointments", data);
        return response.data.data;
    },

    // Patient fetches their own appointments
    getPatientAppointments: async () => {
        const response = await api.get("/patient/appointments");
        return response.data.data;
    },

    // Patient cancels an appointment
    cancelAppointment: async (id) => {
        const response = await api.patch(`/patient/appointments/${id}/cancel`);
        return response.data.data;
    },

    // Doctor fetches their appointments
    getDoctorAppointments: async () => {
        const response = await api.get("/doctor/appointments");
        return response.data.data;
    },

    // Doctor updates appointment status
    updateAppointmentStatus: async (id, status) => {
        const response = await api.patch(`/doctor/appointments/${id}/status`, {
            status,
        });
        return response.data.data;
    },
};

export default appointmentService;
