export interface IReceipt {
    id: number;
    rentId: number;
    totalCost: number;
    issueDate: string;

    issuedById: number;
    issuerName: string;

    carBrand: string;
    carModel: string;

    plannedStart: string;
    plannedEnd: string;

    renterName: string;
}

export interface IReceiptCreateDto {
    rentId: number;
    totalCost: number;
    issueDate: string;
    issuedById: number;
}
