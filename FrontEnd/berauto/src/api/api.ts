import axiosInstance from "./axios.config.ts";
import { ICar } from "../interfaces/ICar.ts";

const Cars = {
    getAvailableCars: (startDate: Date, endDate: Date) => {
        const formattedStartDate = startDate.toISOString();
        const formattedEndDate = endDate.toISOString();

        return axiosInstance.get<ICar[]>(
            `/cars/available?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
        );
    },
    updateCarAvailability: (carId: number, isAvailable: boolean) =>
        axiosInstance.put(`/Car/UpdateCar/${carId}`, { isAvailable }),
};

const Users = {
    getUserRents: (userid: string | undefined) => axiosInstance.get(`/User/GetUserRents/${userid}`),
    getActiveRents: (userid: string | undefined) => axiosInstance.get(`/User/GetActiveRents/${userid}`),
};

const api = { Cars, Users };

export default api;