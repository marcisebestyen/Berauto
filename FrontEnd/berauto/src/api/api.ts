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

import { IUserProfile, IUserUpdateDto } from "../interfaces/IUser"; // Új import
import { ISimpleRent } from "../interfaces/IRent"; // Új import

const Users = {
    // Profiladatok lekérdezése
    getProfileDetails: (userId: string | number) => // Az ID típusa a backendtől függ
        axiosInstance.get<IUserProfile>(`/users/getProfile`), // Módosítsd a valós végpontra!

    // Profiladatok frissítése
    updateProfile: (userId: string | number, data: IUserUpdateDto) =>
        axiosInstance.patch<IUserProfile>(`/users/updateProfile`, data), // Módosítsd a valós végpontra!

    getUserRents: (userId: string | number | undefined) => {
        if (userId === undefined) {
            console.warn("getUserRents: userId is undefined. Returning empty array.");
            return Promise.resolve({ data: [] as ISimpleRent[] });
        }

        return axiosInstance.get<ISimpleRent[]>(`/Rent?userId=${userId}`);
    },

    // JAVÍTOTT RÉSZ: Aktív bérlések lekérdezése
    getActiveRents: (userId: string | number | undefined) => {
        if (userId === undefined) {
            console.warn("getActiveRents: userId is undefined. Returning empty array.");
            return Promise.resolve({ data: [] as ISimpleRent[] });
        }

        return axiosInstance.get<ISimpleRent[]>(`/Rent?userId=${userId}&filter=Running`);
    }

};

const api = { Cars, Users };

export default api;