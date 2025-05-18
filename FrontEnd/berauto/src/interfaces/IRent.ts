export interface IRent {
    id: number;
    carid: number;
    userid: number;
    administratorid: number;
    startdate: Date;
    enddate: Date;
    finished: boolean;
}

export interface ISimpleRent {
    id: number;
    carBrand: string;
    carModel: string;
    plannedStart: string; // Maradhat, ha másra kell
    plannedEnd: string;   // Maradhat, ha másra kell
    actualStart?: string | null; // Tényleges kezdés, lehet null
    actualEnd?: string | null;   // Tényleges befejezés, lehet null
    totalCost?: number;
}