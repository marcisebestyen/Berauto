import axiosInstance from "./axios.config.ts";
import {ICar} from "../interfaces/ICar.ts";

const Cars = {
    getCars: () => axiosInstance.get<ICar[]>('/Car/ListCars')

}

const api = {Cars};

export default api;