export interface IRent {
    id: number;
    carId: number;
    userId: number;
    administratorId?: number | null;
    startDate: Date;
    endDate: Date;
    finished: boolean;
    actualStart?: Date | null;
    actualEnd?: Date | null;
}

export interface ISimpleRent {
    id: number;
    carBrand: string | null;
    carModel: string | null;
    plannedStart: string;
    plannedEnd: string;
    actualStart?: string | null;
    actualEnd?: string | null;
    totalCost?: number | null;
    receiptId?: number | null;
}


export interface IGuestRentCreateDto {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
    licenceId?: string | null;

    carId: number;
    pickUpDepotId: number;
    plannedStart: string;
    plannedEnd: string;
    invoiceRequest: boolean;
}


export interface IRentCreateDto {
    carId: number;
    renterId: number;
    pickUpDepotId: number;
    plannedStart: string;
    plannedEnd: string;
    invoiceRequest: boolean;
}

export interface IRentGetDto {
    id: number;
    plannedStart: string;
    plannedEnd: string;
    actualStart?: string | null;
    actualEnd?: string | null;
    startingKilometer?: number | null;
    endingKilometer?: number | null;
    invoiceRequest: boolean;
    issuedAt?: string | null;

    renterId: number;
    renterName: string;
    carId: number;
    approverId?: number | null;
    issuerId?: number | null;
    recipientId?: number | null;

    carBrand?: string | null;
    carModel?: string | null;

    totalCost?: number | null;
    finished: boolean;
}

export interface IRentForCalendar extends IRentGetDto {
    parsedPlannedStart: Date;
    parsedPlannedEnd: Date;
    parsedActualStart?: Date | null;
    parsedActualEnd?: Date | null;
}
