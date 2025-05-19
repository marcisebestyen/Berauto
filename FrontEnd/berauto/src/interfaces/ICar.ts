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

interface CarFormData {
    Brand: string;
    Model: string;
    FuelType: string; // Stringként kezeljük a Select miatt, a backend konvertálja enumra
    RequiredLicence: string; // Stringként kezeljük, a backend konvertálja enumra
    LicencePlate: string;
    HasValidVignette: boolean;
    PricePerKilometer: number | ''; // Lehet üres string a NumberInput miatt
    IsAutomatic: boolean;
    ActualKilometers: number | ''; // Lehet üres string a NumberInput miatt
    InProperCondition: boolean;
}