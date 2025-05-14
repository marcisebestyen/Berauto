export interface ICar {
    id: number;
    isAvailable: boolean;
    licence: string;
    brand: string;
    model: string;
    licencePlate: string;
    haveValidVignette: boolean;
    price: number;
    seats: number;
    fuelType: string;
    isAutomaticTransmission: boolean;
    trunk: number;
}