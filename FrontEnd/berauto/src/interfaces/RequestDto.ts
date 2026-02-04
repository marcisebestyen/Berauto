export interface IHandOverRequestDto {
    actualStart: string;
}


export interface ITakeBackRequestDto {
    actualEnd: string;
    endingKilometer: number;
    dropOffDepotId: number;
}

export interface IRejectRequestDto {
    reason: string | null;
}


export interface IRejectSuccessResponse {
    message: string;
}

