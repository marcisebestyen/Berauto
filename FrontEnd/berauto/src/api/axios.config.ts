import axios, {InternalAxiosRequestConfig} from 'axios';

import {tokenKeyName} from '../constants/constants';
import dayjs from 'dayjs';
// Globális időzóna/locale konfiguráció betöltése (side-effect import)
import '../utils/timezone';

const rootApiUrl = import.meta.env.VITE_REST_API_URL;
const cleanRootApiUrl = rootApiUrl ? rootApiUrl.replace(/\/$/, '') : '';

const axiosInstance = axios.create({
    baseURL: `${cleanRootApiUrl}/api`,
    withCredentials: true,
});

const DATE_ONLY_KEYS = new Set(['startDate', 'endDate', 'plannedStart', 'plannedEnd']);
const DATETIME_KEYS = new Set(['actualStart', 'actualEnd']);

function transformDateFields(obj: any) {
    if (!obj || typeof obj !== 'object') return obj;
    const out: any = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach((key) => {
        const value = (obj as any)[key];
        if (value instanceof Date) {
            if (DATE_ONLY_KEYS.has(key)) {
                out[key] = dayjs(value).format('YYYY-MM-DD');
            } else if (DATETIME_KEYS.has(key)) {
                out[key] = value.toISOString();
            } else {
                out[key] = value; // nem ismerjük, nem nyúlunk hozzá
            }
        } else if (typeof value === 'string' && DATE_ONLY_KEYS.has(key)) {
            // Normalizáljuk a date-only stringeket is ("YYYY-MM-DD"-re)
            out[key] = dayjs(value).format('YYYY-MM-DD');
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            out[key] = transformDateFields(value);
        } else {
            out[key] = value;
        }
    });
    return out;
}

axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(tokenKeyName);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
        }

        // Egységes dátumkezelés: params és data átalakítása
        if (config.params && typeof config.params === 'object') {
            config.params = transformDateFields(config.params);
        }
        if (config.data && typeof config.data === 'object') {
            config.data = transformDateFields(config.data);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
