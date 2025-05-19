import axiosInstance from "./axios.config.ts";
import { ICar } from "../interfaces/ICar.ts";
import { IUserProfile} from "../interfaces/IUser.ts";
import { ISimpleRent, IGuestRentCreateDto, IRentGetDto, IRentCreateDto } from "../interfaces/IRent.ts";

// JSON Patch művelet interfésze
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
        // Feltételezve, hogy az axiosInstance.baseURL már '/api'-ra végződik
        // (pl. http://localhost:7205/api).
        // Ha a C# CarsController [Route("api/cars")] attribútummal rendelkezik,
        // akkor a relatív útvonal itt '/cars/available' lesz.
        return axiosInstance.get<ICar[]>(
            `/cars/available?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
        );
    },
    updateCarAvailability: (carId: number, isAvailable: boolean) =>
        // Feltételezve, hogy az axiosInstance.baseURL már '/api'-ra végződik.
        // Az útvonalnak meg kell egyeznie a backend controllerével.
        // A backend CarsController-ben kell lennie egy megfelelő PUT végpontnak.
        axiosInstance.put(`/cars/${carId}/availability`, { isAvailable }),
};

const Users = {
    getProfileDetails: () =>
        // Feltételezve, hogy az axiosInstance.baseURL már '/api'-ra végződik.
        // A C# UserController [Route("api/users")] és [HttpGet("getProfile")] alapján:
        axiosInstance.get<IUserProfile>(`/users/getProfile`),

    updateProfile: (patchDocument: JsonPatchOperation[]) =>
        // Feltételezve, hogy az axiosInstance.baseURL már '/api'-ra végződik.
        // A C# UserController [Route("api/users")] és [HttpPatch("updateProfile")] alapján:
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
        // Feltételezve, hogy az axiosInstance.baseURL már '/api'-ra végződik.
        // A backend RentController [Route("api/Rent")] és GetRents actionje alapján:
        return axiosInstance.get<ISimpleRent[]>(`/Rent?userId=${userId}`);
    },

    getActiveRents: (userId: string | number | undefined) => {
        if (userId === undefined) {
            console.warn("getActiveRents: userId is undefined. Returning empty array.");
            return Promise.resolve({ data: [] as ISimpleRent[] });
        }
        // Feltételezve, hogy az axiosInstance.baseURL már '/api'-ra végződik.
        // A backend RentController [Route("api/Rent")] és GetRents actionje alapján, filterrel:
        return axiosInstance.get<ISimpleRent[]>(`/Rent?userId=${userId}&filter=Running`);
    }
};

const Rents = {
    /**
     * Új foglalást hoz létre vendég felhasználóként.
     * A backend RentController [Route("api/Rent")] és [HttpPost("guest-create")] alapján.
     * @param data A vendég foglalási adatai (IGuestRentCreateDto)
     * @returns A létrehozott foglalás adatai (IRentGetDto)
     */
    createGuestRent: (data: IGuestRentCreateDto) =>
        axiosInstance.post<IRentGetDto>('/Rent/guest-create', data),

    /**
     * Új foglalást hoz létre authentikált (bejelentkezett) felhasználóként.
     * A backend RentController [Route("api/Rent")] és [HttpPost("createRent")] alapján.
     * @param data A foglalási adatok (IRentCreateDto)
     * @returns A létrehozott foglalás adatai (IRentGetDto)
     */
    createAuthenticatedRent: (data: IRentCreateDto) =>
        axiosInstance.post<IRentGetDto>('/Rent/createRent', data),
};

// Frissítjük az exportált api objektumot, hogy tartalmazza a Rents-et is
const api = { Cars, Users, Rents };

export default api;
