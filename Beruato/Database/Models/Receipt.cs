namespace Database.Models
{
    public class Receipt
    {
        public int Id { get; set; }
        public int RentId { get; set; }
        public decimal TotalCost { get; set; } // (záró-induló km) * autó km ára
        public DateTime IssueDate { get; set; }
        public int IssuedBy { get; set; }

        public Rent Rent { get; set; }
        public User IssuerOperator { get; set; }
    }
}
