import axiosInstance from "./axios.config.ts";
import {CarFormData, ICar} from "../interfaces/ICar.ts";
import {IUserProfile} from "../interfaces/IUser.ts";
import { ISimpleRent, IGuestRentCreateDto, IRentGetDto, IRentCreateDto } from "../interfaces/IRent.ts";
import { IReceipt, IReceiptCreateDto } from "../interfaces/IReceipt";
import { IHandOverRequestDto, ITakeBackRequestDto, IRejectRequestDto, IRejectSuccessResponse } from "../interfaces/RequestDto.ts";

interface JsonPatchOperation {
    op: "replace" | "add" | "remove" | "copy" | "move" | "test";
    path: string;
    value?: any;
    from?: string;
}

const Cars = {
    getAvailableCars: (startDate: Date, endDate: Date) => {
        const formattedStartDate = startDate.toISOString();
        const formattedEndDate = endDate.toISOString();
        return axiosInstance.get<ICar[]>(
            `/cars/available?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
        );
    },
    updateCar: (id: number, patchDocument: JsonPatchOperation[]) => {
        return axiosInstance.patch<void>(
            `/cars/update/${id}`,
            patchDocument,
            {
                headers: {
                    'Content-Type': 'application/json-patch+json'
                }
            }
        );
    },
    getAllCars: () => {
        return axiosInstance.get<ICar[]>(
            `/cars/get-all`
        );
    },
    createCar: async (carData: CarFormData): Promise<ICar> => {
        const payload = {
            ...carData,
            pricePerKilometer: Number(carData.PricePerDay),
            ActualKilometers: Number(carData.ActualKilometers),
        };
        delete (payload as any).PricePerDay;

        const response = await axiosInstance.post<ICar>('/cars/create-car', payload);
        return response.data;
    },
    deleteCar: (carId: number) => {
        return axiosInstance.delete<void>(`/cars/delete/${carId}`);
    }
};

const Users = {
    getProfileDetails: () =>
        axiosInstance.get<IUserProfile>(`/users/getProfile`),

    updateProfile: (patchDocument: JsonPatchOperation[]) =>
        axiosInstance.patch<IUserProfile>(
            `/users/updateProfile`,
            patchDocument,
            {
                headers: {
                    'Content-Type': 'application/json-patch+json'
                }
            }
        ),

    getUserRents: (userId: string | number | undefined) => {
        if (userId === undefined) {
            console.warn("getUserRents: userId is undefined. Returning empty array.");
            return Promise.resolve({ data: [] as ISimpleRent[] });
        }
        return axiosInstance.get<ISimpleRent[]>(`/Rent?userId=${userId}`);
    },

    getActiveRents: (userId: string | number | undefined) => {
        if (userId === undefined) {
            console.warn("getActiveRents: userId is undefined. Returning empty array.");
            return Promise.resolve({ data: [] as ISimpleRent[] });
        }
        return axiosInstance.get<ISimpleRent[]>(`/Rent?userId=${userId}&filter=Running`);
    }
};

const Rents = {
    createGuestRent: (data: IGuestRentCreateDto) =>
        axiosInstance.post<IRentGetDto>('/Rent/guest-create', data),

    createAuthenticatedRent: (data: IRentCreateDto) =>
        axiosInstance.post<IRentGetDto>('/Rent/createRent', data),

    getRentsGloballyByFilter: (filter: "Open" | "Closed" | "Running" | "All" | "ApprovedForHandover") => {
        return axiosInstance.get<IRentGetDto[]>(`/Rent?filter=${filter}`);
    }
};

const Staff = {
    approveRent: (rentId: number) => {
        return axiosInstance.post<IRentGetDto>(`/staff/approve?rentId=${rentId}`);
    },

    handOverCar: (rentId: number, actualStart: Date) => {
        const requestBody: IHandOverRequestDto = {
            actualStart: actualStart.toISOString()
        };
        return axiosInstance.post<IRentGetDto>(
            `/staff/hand_over?rentId=${rentId}`,
            requestBody
        );
    },

    takeBackCar: (rentId: number, actualEnd: Date, endingKilometer: number) => {
        const requestBody: ITakeBackRequestDto = {
            actualEnd: actualEnd.toISOString(),
            endingKilometer: endingKilometer
        };
        return axiosInstance.post<IRentGetDto>(
            `/staff/take_back?rentId=${rentId}`,
            requestBody
        );
    },

    rejectRent: (rentId: number, reason: string | null) => {
        const requestBody: IRejectRequestDto = {
            reason: reason
        };
        return axiosInstance.post<IRejectSuccessResponse>(
            `/api/staff/reject?rentId=${rentId}`,
            requestBody
        );
    },

    runningRents: () => {
        return axiosInstance.get<IRentGetDto[]>('/Rent?filter=Running');
    },

    completedRents: () => {
        return axiosInstance.get<IRentGetDto[]>('/Rent?filter=Closed');
    }
};


const Receipts = {
    getAll: () => axiosInstance.get<IReceipt[]>("/receipts/GetAllReceipts"),

    getById: (id: number) =>
        axiosInstance.get<IReceipt>(`/receipts/${id}`),

    create: (data: IReceiptCreateDto) =>
        axiosInstance.post<IReceipt>("/receipts/Create", data),

    getForCurrentUser: () =>
        axiosInstance.get<IReceipt[]>("/receipts/user"),
};


const api = { Cars, Users, Rents, Staff, Receipts};

export default api;