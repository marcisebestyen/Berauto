export type FuelType = "Diesel" | "Petrol" | "Hybrid" | "Electric";
export type RequiredLicenceType = "AM" | "A1" | "A2" | "A" | "B";

export interface ICar {
    id: number;
    brand: string;
    model: string;
    fuelType: FuelType;
    requiredLicence: RequiredLicenceType;
    licencePlate: string;
    hasValidVignette: boolean;
    pricePerKilometer: number;
    isAutomatic: boolean;
    actualKilometers: number;
}