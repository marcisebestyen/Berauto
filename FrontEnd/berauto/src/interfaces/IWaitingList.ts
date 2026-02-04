export enum WaitingStatus {
    Active = 0,
    Notified = 1,
    Booked = 2,
    Canceled = 3,
}

export interface IWaitingListResponse {
    message: string,
    waitingListId: number,
    userId: number,
    carId: number,
    queuePosition: number,
    queuedAt?: Date,
    notifiedAt?: Date,
    status: WaitingStatus
}