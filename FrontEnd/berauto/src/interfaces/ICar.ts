export type FuelType = "Diesel" | "Petrol" | "Hybrid" | "Electric";
export type RequiredLicenceType = "AM" | "A1" | "A2" | "A" | "B";

export enum CarAvailabilityStatus {
    Available = 0,
    Rented = 1,
    NotProperCondition = 2,
    Deleted = 3,
}

export interface ICar {
    id: number;
    brand: string;
    model: string;
    fuelType: FuelType;
    requiredLicence: RequiredLicenceType;
    licencePlate: string;
    hasValidVignette: boolean;
    pricePerDay: number;
    isAutomatic: boolean;
    actualKilometers: number;
    inProperCondition: boolean;
    isDeleted: boolean;
    isRented: boolean;
    status: CarAvailabilityStatus;
}

export interface CarFormData {
    Brand: string;
    Model: string;
    FuelType: string;
    RequiredLicence: string;
    LicencePlate: string;
    HasValidVignette: boolean;
    PricePerDay: number | '';
    IsAutomatic: boolean;
    ActualKilometers: number | '';
    InProperCondition: boolean;
}