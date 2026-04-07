import axios from "axios";

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

    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const requestConfig = error.config;

        const shouldRetryWithNextBaseUrl =
            !configuredApiBaseUrl &&
            requestConfig &&
            !requestConfig.__apiBaseRetried &&
            (!error.response || [404, 405].includes(error.response?.status));

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

        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
        return Promise.reject(error);
    },
);

export const getResolvedApiBaseUrl = () => resolvedApiBaseUrl;

export default api;
