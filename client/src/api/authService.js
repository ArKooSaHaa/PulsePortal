import api from "./axios";

const SESSION_USER_KEY = "user";
const SESSION_TOKEN_KEY = "token";

const saveSessionUser = (user) => {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    return user;
};

const normalizeApiError = (err) => {
    if (!err.response) {
        const networkError = new Error(
            "Network error. Please check your connection and backend server.",
        );
        networkError.response = { data: { message: networkError.message } };
        throw networkError;
    }

    throw err;
};

const authService = {
    register: async (name, email, password) => {
        try {
            const response = await api.post("/register", {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
            });

            const user = response.data?.data;
            if (!user) {
                throw new Error("Unexpected response from register API.");
            }

            return saveSessionUser(user);
        } catch (err) {
            normalizeApiError(err);
        }
    },

    login: async (email, password) => {
        try {
            const response = await api.post("/login", {
                email: email.trim().toLowerCase(),
                password,
            });

            const payload = response.data?.data;
            if (!payload) {
                throw new Error("Unexpected response from login API.");
            }

            if (payload.token) {
                localStorage.setItem(SESSION_TOKEN_KEY, payload.token);
            }

            return saveSessionUser(payload);
        } catch (err) {
            normalizeApiError(err);
        }
    },

    logout: async () => {
        localStorage.removeItem(SESSION_USER_KEY);
        localStorage.removeItem(SESSION_TOKEN_KEY);
    },

    getCurrentUser: () => {
        const raw = localStorage.getItem(SESSION_USER_KEY);
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch {
            localStorage.removeItem(SESSION_USER_KEY);
            return null;
        }
    },

    isLoggedIn: () => {
        return !!localStorage.getItem(SESSION_USER_KEY);
    },
};

export default authService;