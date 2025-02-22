namespace Database.Models
{
    public class Rent
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
}
