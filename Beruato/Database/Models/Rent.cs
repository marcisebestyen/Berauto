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
        public bool Finished { get; set; } = false;

        public Car Car { get; set; }
        public User User { get; set; }
        public User Administrator { get; set; }
    }
}
