import axios, { InternalAxiosRequestConfig } from 'axios';

import { tokenKeyName } from '../constants/constants';

const rootApiUrl = import.meta.env.VITE_REST_API_URL;
const cleanRootApiUrl = rootApiUrl ? rootApiUrl.replace(/\/$/, '') : '';

const axiosInstance = axios.create({
    baseURL: `${cleanRootApiUrl}/api`,
    withCredentials: true,
});

// Request Interceptor hozzáadása
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Token lekérése a localStorage-ból a konstansban megadott kulccsal
        const token = localStorage.getItem(tokenKeyName); // <-- KONSTANS HASZNÁLATA ITT

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
        }
        return config;
    },
    (error) => {
        // Kérés konfigurációs hiba esetén
        return Promise.reject(error);
    }
);

export default axiosInstance;
