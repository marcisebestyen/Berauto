namespace Database.Models
{
    public class Receipt
    {
        public int Id { get; set; }
        public int RentId { get; set; }
        public double Cost { get; set; }
        public DateTime IssueDate { get; set; }

        public Rent Rent { get; set; } = new();
    }
}
