// interfaces/IRent.ts

/**
 * Alapvető Rent interfész, ami tükrözheti a backend Rent entitásának néhány mezőjét.
 * A frontenden ritkábban használjuk közvetlenül, inkább specifikusabb DTO interfészeket.
 */
export interface IRent {
    id: number;
    carId: number; // A C# kódban carid volt, de a konvenciók szerint carId jobb
    userId: number; // A C# kódban userid volt
    administratorId?: number | null; // A C# kódban administratorid volt, és lehet null
    startDate: Date; // A C# kódban startdate volt, itt Date objektumot feltételezünk
    endDate: Date;   // A C# kódban enddate volt, itt Date objektumot feltételezünk
    finished: boolean;
    // Esetleg további mezők, mint actualStart, actualEnd, ha az alap entitás része
    actualStart?: Date | null;
    actualEnd?: Date | null;
}

/**
 * Egyszerűsített nézet egy bérlésről, pl. listázáshoz a profil oldalon.
 * Tartalmazza a backend által küldött plannedStart, plannedEnd, actualStart, actualEnd mezőket.
 */
export interface ISimpleRent {
    id: number;
    carBrand: string | null; // Lehet null, ha az autó adat nem érkezik meg
    carModel: string | null; // Lehet null
    plannedStart: string;    // Backendtől stringként érkezik (pl. ISO 8601)
    plannedEnd: string;      // Backendtől stringként érkezik
    actualStart?: string | null; // Tényleges kezdés, stringként érkezik, lehet null
    actualEnd?: string | null;   // Tényleges befejezés, stringként érkezik, lehet null
    totalCost?: number | null;   // Teljes költség, lehet null
}

/**
 * DTO vendég felhasználó általi foglalás létrehozásához.
 * Ezt küldi a frontend a /Rent/guest-create végpontra.
 */
export interface IGuestRentCreateDto {
    // Vendég adatai
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
    licenceId?: string | null;

    // Bérlés adatai
    carId: number;
    plannedStart: string; // ISO string formátumban küldjük a backendnek
    plannedEnd: string;   // ISO string formátumban küldjük a backendnek
    invoiceRequest: boolean; // A C# DTO-ban 'InvoiceRequest' volt
}

/**
 * DTO bejelentkezett felhasználó általi foglalás létrehozásához.
 * Ezt küldi a frontend a /Rent/createRent végpontra.
 */
export interface IRentCreateDto {
    carId: number;
    renterId: number;     // A bejelentkezett felhasználó ID-ja
    plannedStart: string; // ISO string formátumban
    plannedEnd: string;   // ISO string formátumban
    invoiceRequest: boolean; // A C# DTO-ban 'InvoiceRequest' volt
}

/**
 * DTO, amit a backend visszaad egy bérlés lekérdezésekor vagy létrehozása után.
 * Megfelel a C# RentGetDto-nak.
 */
export interface IRentGetDto {
    id: number;
    plannedStart: string; // Backendtől stringként érkezik
    plannedEnd: string;   // Backendtől stringként érkezik
    actualStart?: string | null;
    actualEnd?: string | null;
    startingKilometer?: number | null;
    endingKilometer?: number | null;
    invoiceRequest: boolean;
    issuedAt?: string | null; // Számla kiállítási dátuma

    renterId: number;
    carId: number;
    approverId?: number | null;
    issuerId?: number | null;
    recipientId?: number | null;

    // Autó adatai, amiket a backend a RentGetDto-ba map-el
    carBrand?: string | null;
    carModel?: string | null;
    // Esetleg más szükséges mezők a RentGetDto-ból
    totalCost?: number | null; // Ha a backend számolja és küldi
}
