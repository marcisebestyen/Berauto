namespace Database.Dtos.CarDtos
{
    public enum CarAvailabilityStatus
    {
        Available,
        Rented,
        NotProperCondition,
        Deleted
    }

    public class CarGetWithStatusDto : CarGetDto
    {
        public CarAvailabilityStatus Status { get; set; }
    }
}