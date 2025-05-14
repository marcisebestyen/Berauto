export interface IRent {
    id: number;
    carid: number;
    userid: number;
    administratorid: number;
    startdate: Date;
    enddate: Date;
    finished: boolean;
}