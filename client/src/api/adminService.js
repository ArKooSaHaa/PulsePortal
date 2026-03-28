import api from "./axios";

const adminService = {
    // ── Doctor management ─────────────────────────────────────
    createDoctor: async (data) => {
        const response = await api.post("/admin/doctors", data);
        return response.data.data;
    },

    getDoctors: async () => {
        const response = await api.get("/admin/doctors");
        return response.data.data;
    },

    // ── Admin management ──────────────────────────────────────
    createAdmin: async (data) => {
        const response = await api.post("/admin/admins", data);
        return response.data.data;
    },

    // ── Overview data ─────────────────────────────────────────
    getPatients: async () => {
        const response = await api.get("/admin/patients");
        return response.data.data;
    },

    getAllAppointments: async () => {
        const response = await api.get("/admin/appointments");
        return response.data.data;
    },

    getStats: async () => {
        const response = await api.get("/admin/stats");
        return response.data.data;
    },
};

export default adminService;
