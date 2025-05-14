import axiosInstance from "./axios.config.ts";
import {ICar} from "../interfaces/ICar.ts";

const Cars = {
    getCars: () => axiosInstance.get<ICar[]>('/Car/GetAvailableCars'),
    }

const Users = {
    getUserRents: (userid: string | undefined) => axiosInstance.get(`/User/GetUserRents/${userid}`),
    getActiveRents: (userid: string | undefined) => axiosInstance.get(`/User/GetActiveRents/${userid}`),
}
const api = {Cars, Users};

export default api;