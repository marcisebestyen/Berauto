import axiosInstance from "./axios.config.ts";
import { ICar } from "../interfaces/ICar.ts";
import { IUserProfile} from "../interfaces/IUser.ts";
import { ISimpleRent, IGuestRentCreateDto, IRentGetDto, IRentCreateDto } from "../interfaces/IRent.ts";

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
    updateCarAvailability: (carId: number, isAvailable: boolean) =>
        axiosInstance.put(`/cars/${carId}/availability`, { isAvailable }),
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
    approveRent: (rentId: number) =>
        axiosInstance.post<IRentGetDto>(`/Staff/approve?rentId=${rentId}`), // rentId query paraméterként

    /**
     * Egy bérléshez tartozó autó átadásának rögzítése.
     * A backend StaffController [Route("api/Staff")] és [HttpPost("hand_over")] alapján.
     * A rentId és actualStart query paraméterként kerül elküldésre.
     * @param rentId Az átadandó bérlés ID-ja.
     * @param actualStart A tényleges átadás dátuma és ideje (Date objektum).
     * @returns A frissített bérlés adatai.
     */
    handOverCar: (rentId: number, actualStart: Date) => {
        // A dátumot ISO stringgé alakítjuk, ami általában jól működik query paraméterként is.
        // Az URL kódolást (pl. szóközök %20-ra cserélése) az Axios automatikusan elvégzi.
        const formattedActualStart = actualStart.toISOString();
        // POST kérés üres body-val (vagy null), a paraméterek az URL-ben vannak.
        return axiosInstance.post<IRentGetDto>(`/Staff/hand_over?rentId=${rentId}&actualStart=${formattedActualStart}`);
    },

    takeBackCar: (rentId: number, actualEnd: Date, endingKilometer: number) => {
        // Ennél a végpontnál a C# controller paraméterei (rentId, actualEnd, endingKilometer)
        // valószínűleg a request body-ból várják az adatokat, ha nincsenek [FromQuery] attribútummal ellátva.
        // Ha a Swagger ezt is query paraméterekkel mutatja, akkor ezt is át kellene alakítani.
        // Most feltételezzük, hogy ez body-ban megy, ahogy korábban volt.
        const payload = {
            rentId,
            actualEnd: actualEnd.toISOString(),
            endingKilometer,
        };
        return axiosInstance.post<IRentGetDto>(`/Staff/take_back`, payload);
    },
};

const api = { Cars, Users, Rents, Staff };

export default api;
