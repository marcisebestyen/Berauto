import axios from 'axios';

// Az eredeti környezeti változóból kiolvasott URL
const rootApiUrl = import.meta.env.VITE_REST_API_URL;

// Biztonsági ellenőrzés és az '/api' hozzáfűzése
// Eltávolítjuk a végéről a perjelet, ha van, hogy ne legyen dupla perjel (pl. http://localhost:7205//api)
const cleanRootApiUrl = rootApiUrl ? rootApiUrl.replace(/\/$/, '') : '';

const axiosInstance = axios.create({
    baseURL: `${cleanRootApiUrl}/api`, // Itt fűzzük hozzá az /api-t
    withCredentials: true // EZ FONTOS, ha van token / auth
});

export default axiosInstance;