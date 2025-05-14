export interface ICar {
    id: number;
    isAvailable: boolean;
    licence: string; // e.g., "B", "A1", etc.
    brand: string;
    model: string;
    licencePlate: string;
    haveValidVignette: boolean;
    price: number; // Assuming this can be a decimal value
    seats: number;
    fuelType: string; // e.g., "Hybrid", "Petrol", etc.
    isAutomaticTransmission: boolean;
    trunk: number;
}