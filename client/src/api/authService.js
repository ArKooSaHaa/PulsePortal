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

const AUTH_ENDPOINTS = {
    register: ["/auth/register", "/register"],
    login: ["/auth/login", "/login"],
    logout: ["/auth/logout", "/logout"],
    refresh: ["/auth/refresh", "/refresh"],
};

const isMissingAuthEndpointError = (err) => {
    const status = err?.response?.status;
    if ([404, 405].includes(status)) {
        return true;
    }

    const message = String(err?.response?.data?.message || "").toLowerCase();

    return message.includes("route") && message.includes("could not be found");
};

const postWithAuthPathFallback = async (paths, payload = null) => {
    let lastError;

    for (const path of paths) {
        try {
            return payload === null ? await api.post(path) : await api.post(path, payload);
        } catch (err) {
            lastError = err;
            if (!isMissingAuthEndpointError(err)) {
                throw err;
            }
        }
    }

    throw lastError;
};

const authService = {
    register: async (name, email, password, confirmPassword) => {
        try {
            const response = await postWithAuthPathFallback(AUTH_ENDPOINTS.register, {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                confirm_password: confirmPassword,
                password_confirmation: confirmPassword,
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
            const response = await postWithAuthPathFallback(AUTH_ENDPOINTS.login, {
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
            await postWithAuthPathFallback(AUTH_ENDPOINTS.logout);
        } catch {
            // Always clear local session even if server token was already invalid.
        }
        localStorage.removeItem(SESSION_USER_KEY);
        localStorage.removeItem(SESSION_TOKEN_KEY);
    },

    refreshToken: async () => {
        try {
            const response = await postWithAuthPathFallback(AUTH_ENDPOINTS.refresh);
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