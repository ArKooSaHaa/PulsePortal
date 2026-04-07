import api, { getResolvedApiBaseUrl } from "./axios";

const SESSION_USER_KEY = "user";
const SESSION_TOKEN_KEY = "token";

const saveSessionUser = (user) => {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    return user;
};

const normalizeApiError = (err) => {
    if (!err.response) {
        const baseUrl = getResolvedApiBaseUrl();
        const networkError = new Error(
            `Network error while reaching ${baseUrl || "the API server"}. Check backend URL, CORS, and server status.`,
        );
        networkError.response = { data: { message: networkError.message } };
        throw networkError;
    }

    throw err;
};

const authService = {
    register: async (name, email, password, confirmPassword) => {
        try {
            const response = await api.post("/register", {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                confirm_password: confirmPassword,
            });

            const token = response.data?.access_token;
            const user = response.data?.user;
            if (!token || !user) {
                throw new Error("Unexpected response from register API.");
            }

            localStorage.setItem(SESSION_TOKEN_KEY, token);

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

            const token = response.data?.access_token;
            const user = response.data?.user;
            if (!token || !user) {
                throw new Error("Unexpected response from login API.");
            }

            localStorage.setItem(SESSION_TOKEN_KEY, token);

            return saveSessionUser(user);
        } catch (err) {
            normalizeApiError(err);
        }
    },

    logout: async () => {
        try {
            await api.post("/logout");
        } catch {
            // Always clear local session even if server token was already invalid.
        }
        localStorage.removeItem(SESSION_USER_KEY);
        localStorage.removeItem(SESSION_TOKEN_KEY);
    },

    refreshToken: async () => {
        try {
            const response = await api.post("/refresh");
            const token = response.data?.access_token;
            const user = response.data?.user;

            if (!token || !user) {
                throw new Error("Unexpected response from refresh API.");
            }

            localStorage.setItem(SESSION_TOKEN_KEY, token);
            return saveSessionUser(user);
        } catch (err) {
            normalizeApiError(err);
        }
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
        return !!localStorage.getItem(SESSION_TOKEN_KEY);
    },

    getToken: () => {
        return localStorage.getItem(SESSION_TOKEN_KEY);
    },
};

export default authService;