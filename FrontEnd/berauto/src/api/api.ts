import axiosInstance from "./axios.config.ts";
import {CarFormData, ICar} from "../interfaces/ICar.ts";
import {IUserProfile} from "../interfaces/IUser.ts";
import {ISimpleRent, IGuestRentCreateDto, IRentGetDto, IRentCreateDto} from "../interfaces/IRent.ts";
import {IDepot} from "../interfaces/IDepot.ts";
import {IReceipt, IReceiptCreateDto} from "../interfaces/IReceipt";
import {IWaitingListResponse} from "../interfaces/IWaitingList.ts";
import {
    IHandOverRequestDto,
    ITakeBackRequestDto,
    IRejectRequestDto,
    IRejectSuccessResponse
} from "../interfaces/RequestDto.ts";
import {IStatistics} from "../interfaces/IStatistics.ts";

interface JsonPatchOperation {
    op: "replace" | "add" | "remove" | "copy" | "move" | "test";
    path: string;
    value?: any;
    from?: string;
}


const Cars = {
    getAvailableCars: (startDate: Date, endDate: Date, depotId?: number) => {
        const params: Record<string, any> = {
            startDate,
            endDate,
        };
        if (typeof depotId === 'number') {
            params.depotId = depotId;
        }
        // A globális interceptor "YYYY-MM-DD" formátumra alakítja a date-only mezőket
        return axiosInstance.get<ICar[]>('/cars/available', { params });
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
            pricePerDay: Number(carData.PricePerDay),
            ActualKilometers: Number(carData.ActualKilometers),
        };
        delete (payload as any).PricePerDay;

        const response = await axiosInstance.post<ICar>('/cars/create-car', payload);
        return response.data;
    },
    deleteCar: (carId: number) => {
        return axiosInstance.delete<void>(`/cars/delete/${carId}`);
    },
    getCarById(carId: number) {
        return axiosInstance.get<ICar>(`/cars/get/${carId}`);
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
            return Promise.resolve({data: [] as ISimpleRent[]});
        }
        return axiosInstance.get<ISimpleRent[]>(`/Rent?userId=${userId}`);
    },

    getActiveRents: (userId: string | number | undefined) => {
        if (userId === undefined) {
            console.warn("getActiveRents: userId is undefined. Returning empty array.");
            return Promise.resolve({data: [] as ISimpleRent[]});
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
    },
    getRentsByCarId(carId: number) {
        return axiosInstance.get<IRentGetDto[]>(`/Rent/get-rents-by-carId/${carId}`);
    },
    addToWaitingList(carId: number) {
        return axiosInstance.post<IWaitingListResponse>(`/Rent/add-to-waiting-list/${carId}`);
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

    takeBackCar: (rentId: number, actualEnd: Date, endingKilometer: number, dropOffDepotId: number) => {
        const requestBody: ITakeBackRequestDto = {
            actualEnd: actualEnd.toISOString(),
            endingKilometer: endingKilometer,
            dropOffDepotId: dropOffDepotId
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
            `/staff/reject?rentId=${rentId}`,
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

const Statistics = {
    getDashboardStats: () => {
        return axiosInstance.get<IStatistics>('/statistics/dashboard');
    }
}
const Depots = {
    /**
     * Lekérdezi az összes telephelyet (nyilvános endpoint).
     */
    getAll: () =>
        axiosInstance.get<IDepot[]>('/depots/get-all'),

    /**
     * Lekérdezi egy telephely adatait azonosító alapján (nyilvános endpoint).
     */
    getById: (depotId: number) =>
        axiosInstance.get<IDepot>(`/depots/get/${depotId}`),

    /**
     * Új telephely létrehozása (Admin csak).
     */
    create: (data: Omit<IDepot, 'id'>) =>
        axiosInstance.post<IDepot>('/depots/create-depot', data),

    /**
     * Telephely módosítása JSON Patch dokumentummal (Admin csak).
     */
    update: (depotId: number, patchDocument: JsonPatchOperation[]) =>
        axiosInstance.patch<void>(
            `/depots/update/${depotId}`,
            patchDocument,
            {
                headers: {
                    'Content-Type': 'application/json-patch+json'
                }
            }
        ),

    /**
     * Telephely törlése (Admin csak).
     */
    delete: (depotId: number) =>
        axiosInstance.delete<void>(`/depots/delete/${depotId}`)
};

const Receipts = {
    getAll: () => axiosInstance.get<IReceipt[]>("/receipts/GetAllReceipts"),

    getById: (id: number) =>
        axiosInstance.get<IReceipt>(`/receipts/${id}`),

    create: (data: IReceiptCreateDto) =>
        axiosInstance.post<IReceipt>("/receipts/Create", data),

    getForCurrentUser: () =>
        axiosInstance.get<IReceipt[]>("/receipts/user"),

    downloadReceipt: (receiptId: number) => {
        return axiosInstance.get(`/receipts/${receiptId}/download`, {
            responseType: 'blob',
        });
    }
};


const api = {Cars, Users, Rents, Staff, Depots, Receipts, Statistics};

export default api;