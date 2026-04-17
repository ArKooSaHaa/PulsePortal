import axios from "axios";

const SESSION_TOKEN_KEY = "token";
const SESSION_USER_KEY = "user";

const normalizeApiBaseUrl = (value) => {
    if (!value || typeof value !== "string") {
        return "";
    }

    const trimmed = value.trim().replace(/\/+$/, "");
    if (!trimmed) {
        return "";
    }

    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const runtimeProtocol =
    typeof window !== "undefined" && window.location.protocol === "https:"
        ? "https"
        : "http";

const runtimeHost =
    typeof window !== "undefined" && window.location.hostname
        ? window.location.hostname
        : "127.0.0.1";

const runtimeOrigin =
    typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : `${runtimeProtocol}://${runtimeHost}`;

const runtimePort =
    typeof window !== "undefined" && window.location.port
        ? window.location.port
        : "";

const isLikelyFrontendDevPort = ["3000", "4173", "5173", "5174", "5175"].includes(
    runtimePort,
);

const isLoopbackHost = (host) => host === "localhost" || host === "127.0.0.1";

const candidateHosts = Array.from(
    new Set(
        [
            runtimeHost,
            ...(isLoopbackHost(runtimeHost) ? ["127.0.0.1", "localhost"] : []),
        ].filter(Boolean),
    ),
);

const configuredApiBaseUrl = normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL,
);

const candidateApiBaseUrls = Array.from(
    new Set(
        [
            ...candidateHosts.flatMap((host) => [
                normalizeApiBaseUrl(`${runtimeProtocol}://${host}:8001`),
                normalizeApiBaseUrl(`${runtimeProtocol}://${host}:8000`),
            ]),
            ...(isLikelyFrontendDevPort ? [] : [normalizeApiBaseUrl(runtimeOrigin)]),
        ].filter(Boolean),
    ),
);

let resolvedApiBaseUrl = configuredApiBaseUrl || candidateApiBaseUrls[0] || "";
let resolveApiBaseUrlPromise = null;
let refreshSessionPromise = null;

const clearSession = () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
};

const redirectToAuthIfNeeded = () => {
    if (typeof window === "undefined") {
        return;
    }

    const currentPath = String(window.location.pathname || "");
    if (!currentPath.startsWith("/auth")) {
        window.location.assign("/auth");
    }
};

const saveSessionUser = (user) => {
    if (!user || typeof user !== "object") {
        return;
    }

    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
};

const updateResolvedBaseUrl = (nextBaseUrl) => {
    if (!nextBaseUrl) {
        return;
    }
    resolvedApiBaseUrl = nextBaseUrl;
};

const getNextApiBaseUrl = (currentBaseUrl) => {
    if (!candidateApiBaseUrls.length) {
        return null;
    }

    const currentIndex = candidateApiBaseUrls.indexOf(currentBaseUrl);
    const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

    for (let offset = 0; offset < candidateApiBaseUrls.length; offset += 1) {
        const idx = (startIndex + offset) % candidateApiBaseUrls.length;
        const candidate = candidateApiBaseUrls[idx];
        if (candidate && candidate !== currentBaseUrl) {
            return candidate;
        }
    }

    return null;
};

const isPulsePortalHealthResponse = (payload) => {
    return (
        payload?.success === true &&
        typeof payload?.message === "string" &&
        payload.message.toLowerCase().includes("pulse portal api")
    );
};

const resolveApiBaseUrl = async () => {
    if (configuredApiBaseUrl) {
        return configuredApiBaseUrl;
    }

    if (resolveApiBaseUrlPromise) {
        return resolveApiBaseUrlPromise;
    }

    resolveApiBaseUrlPromise = (async () => {
        for (const candidateBaseUrl of candidateApiBaseUrls) {
            try {
                const probe = await axios.get(candidateBaseUrl, {
                    timeout: 2000,
                    headers: { Accept: "application/json" },
                });

                if (isPulsePortalHealthResponse(probe.data)) {
                    updateResolvedBaseUrl(candidateBaseUrl);
                    return candidateBaseUrl;
                }
            } catch {
                // Ignore candidate failures and continue probing.
            }
        }

        return resolvedApiBaseUrl;
    })();

    return resolveApiBaseUrlPromise;
};

const isMissingAuthEndpointError = (error) => {
    const statusCode = error?.response?.status;
    if ([404, 405].includes(statusCode)) {
        return true;
    }

    const message = String(error?.response?.data?.message || "").toLowerCase();
    return message.includes("route") && message.includes("could not be found");
};

const AUTH_PATH_SUFFIXES = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/login",
    "/register",
    "/refresh",
    "/logout",
];

const shouldAttemptTokenRefresh = (requestConfig, statusCode) => {
    if (statusCode !== 401 || !requestConfig || requestConfig.__isRetryAfterRefresh) {
        return false;
    }

    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
        return false;
    }

    const url = String(requestConfig.url || "");

    return !AUTH_PATH_SUFFIXES.some((path) => url.endsWith(path));
};

const requestRefreshToken = async (baseUrl, currentToken) => {
    let lastError;
    const refreshPaths = ["/auth/refresh", "/refresh"];

    for (const refreshPath of refreshPaths) {
        try {
            return await axios.post(`${baseUrl}${refreshPath}`, null, {
                timeout: 10000,
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${currentToken}`,
                },
            });
        } catch (error) {
            lastError = error;
            if (!isMissingAuthEndpointError(error)) {
                throw error;
            }
        }
    }

    throw lastError;
};

const getRefreshPayload = (responseData) => {
    const nestedPayload =
        responseData?.data && typeof responseData.data === "object"
            ? responseData.data
            : null;

    const token =
        nestedPayload?.access_token ||
        nestedPayload?.token ||
        responseData?.access_token ||
        responseData?.token ||
        null;

    const user = nestedPayload?.user || responseData?.user || null;

    return { token, user };
};

const refreshSessionToken = async (baseUrlOverride = "") => {
    if (refreshSessionPromise) {
        return refreshSessionPromise;
    }

    refreshSessionPromise = (async () => {
        const currentToken = localStorage.getItem(SESSION_TOKEN_KEY);
        if (!currentToken) {
            throw new Error("No session token available for refresh.");
        }

        const baseUrl = baseUrlOverride || (await resolveApiBaseUrl());
        const response = await requestRefreshToken(baseUrl, currentToken);

        const { token: refreshedToken, user } = getRefreshPayload(response.data);
        if (!refreshedToken || typeof refreshedToken !== "string") {
            throw new Error("Refresh endpoint did not return a valid access token.");
        }

        localStorage.setItem(SESSION_TOKEN_KEY, refreshedToken);
        saveSessionUser(user);

        return refreshedToken;
    })().finally(() => {
        refreshSessionPromise = null;
    });

    return refreshSessionPromise;
};

const api = axios.create({
    timeout: 10000,
    headers: {
        Accept: "application/json",
    },
});

api.interceptors.request.use(async (config) => {
    config.baseURL = await resolveApiBaseUrl();

    // If we're sending FormData, let Axios set the correct multipart boundary.
    // Otherwise, Axios will default to JSON automatically.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        if (config.headers && typeof config.headers === "object") {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }
    }

    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const requestConfig = error.config;
        const statusCode = error.response?.status;

        const shouldRetryWithNextBaseUrl =
            requestConfig &&
            !requestConfig.__apiBaseRetried &&
            (!error.response || [404, 405].includes(statusCode));

        if (shouldRetryWithNextBaseUrl) {
            const currentBaseUrl = requestConfig.baseURL || resolvedApiBaseUrl;
            const nextBaseUrl = getNextApiBaseUrl(currentBaseUrl);

            if (nextBaseUrl) {
                updateResolvedBaseUrl(nextBaseUrl);
                requestConfig.baseURL = nextBaseUrl;
                requestConfig.__apiBaseRetried = true;
                return api.request(requestConfig);
            }
        }

        if (shouldAttemptTokenRefresh(requestConfig, statusCode)) {
            try {
                const refreshedToken = await refreshSessionToken(
                    requestConfig.baseURL || resolvedApiBaseUrl,
                );

                requestConfig.__isRetryAfterRefresh = true;
                requestConfig.headers = requestConfig.headers || {};
                requestConfig.headers.Authorization = `Bearer ${refreshedToken}`;

                return api.request(requestConfig);
            } catch {
                clearSession();
            }
        }

        if (statusCode === 401) {
            clearSession();
            redirectToAuthIfNeeded();
        }

        return Promise.reject(error);
    },
);

export const getResolvedApiBaseUrl = () => resolvedApiBaseUrl;

export default api;
