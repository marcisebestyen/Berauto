namespace Database.Dtos
{
    public class ReceiptDto
    {
        public int Id { get; set; }
        public int RentId { get; set; }
        public decimal Cost { get; set; }
        public DateTime IssueDate { get; set; }
        public RentDto Rent { get; set; } = new();
    }

    public class CreateReceiptDto
    {
        public int RentId { get; set; }
        public decimal Cost { get; set; }
        public DateTime IssueDate { get; set; }
    }

    public class UpdateReceiptDto
    {
        public decimal? Cost { get; set; }
        public DateTime? IssueDate { get; set; }
    }
}