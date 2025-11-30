import axios from "axios";

const baseURL = import.meta.env.DEV
    ? import.meta.env.VITE_API_BASE_URL_LOCAL
    : import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL,
});

api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (user?.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🔴 Auto logout on 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== "undefined") {
            // 🚨 Token expired or invalid
            localStorage.removeItem("user");
            // 🚪 Redirect to login
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export { api };
