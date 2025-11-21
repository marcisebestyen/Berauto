export interface IStatistics{
    activeRentsCount: number;
    pendingRequestsCount: number;
    totalCarsCount: number;
    carsOnWarningListCount: number;
    totalRevenueAllTime: number;
    revenueThisMonth: number;
    popularCars: {
        carId: number;
        brand: string;
        model: string;
        rentCount: number;
    }[];
    rentsLast30Days: {
        date: string;
        count: number;
    }[];
}