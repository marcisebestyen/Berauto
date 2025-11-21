namespace Database.Dtos.StatisticsDtos
{
    public class PopularCarDto
    {
        public int CarId { get; set; }
        public string Brand { get; set; }
        public string Model { get; set; }
        public int TotalRentDays { get; set; }
        public int RentCount { get; set; }
    }
}