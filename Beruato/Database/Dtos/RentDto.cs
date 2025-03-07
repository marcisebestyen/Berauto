using Database.Models;

namespace Database.Dtos
{
    public class RentDto
    {
        public int Id { get; set; }
        public int CarId { get; set; }
        public int UserId { get; set; }
        public int AdministratorId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool Finished { get; set; } 

        public Car Car { get; set; } = new();
        public User User { get; set; } = new();
        public User Administrator { get; set; } = new();
    }

    public class CreateRentDto
    {
        public int CarId { get; set; }
        public int UserId { get; set; }
        public int AdministratorId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
    public class UpdateRentDto
    {
        public int? CarId { get; set; }
        public int? UserId { get; set; }
        public int? AdministratorId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? Finished { get; set; }
    }

    public class ListRendDto
    {
        public int Id { get; set; }
        public string CarModel { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool Finished { get; set; }
    }
}
