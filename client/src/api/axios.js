import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    timeout: 10000,
    headers: {
        Accept: "application/json",
    },
});

api.interceptors.request.use((config) => {
    // If we're sending FormData, let Axios set the correct multipart boundary.
    // Otherwise, Axios will default to JSON automatically.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        if (config.headers && typeof config.headers === "object") {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }
    }

    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
        return Promise.reject(error);
    },
);

export default api;
