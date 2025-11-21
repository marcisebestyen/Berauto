using Database.Dtos.CarDtos;

namespace Database.Dtos.StatisticsDtos
{
    public class DashboardStatisticsDto
    {
        // Általános számok a kártyákhoz
        public int ActiveRentsCount { get; set; }
        public int PendingRequestsCount { get; set; }
        public int TotalCarsCount { get; set; }
        public int CarsOnWarningListCount { get; set; } // Pl. karbantartásra szoruló autók

        // Pénzügyi adatok
        public decimal TotalRevenueAllTime { get; set; }
        public decimal RevenueThisMonth { get; set; }

        // Listák a grafikonokhoz és táblázatokhoz
        public List<PopularCarDto> PopularCars { get; set; } = new();
        public List<DailyRentCountDto> RentsLast30Days { get; set; } = new();
    }
}