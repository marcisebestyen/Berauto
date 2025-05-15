import axiosInstance from "./axios.config.ts";
import {ICar} from "../interfaces/ICar.ts";

const Cars = {
    getCars: () => axiosInstance.get<ICar[]>('/Car/GetAvailableCars'),
    updateCarAvailability: (carId: number, isAvailable: boolean) => axiosInstance.put(`/Car/UpdateCar/${carId}`, { isAvailable }),
}

const Users = {
    getUserRents: (userid: string | undefined) => axiosInstance.get(`/User/GetUserRents/${userid}`),
    getActiveRents: (userid: string | undefined) => axiosInstance.get(`/User/GetActiveRents/${userid}`),
}
const api = {Cars, Users};

export default api;