import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_REST_API_URL,
    withCredentials: true // EZ FONTOS, ha van token / auth
});

export default axiosInstance;