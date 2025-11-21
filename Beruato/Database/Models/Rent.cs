namespace Database.Models
{
    public class Rent
    {
        public int Id { get; set; }
        public int RenterId { get; set; }
        public DateTime PlannedStart { get; set; }
        public DateTime PlannedEnd { get; set; }
        public DateTime? ActualStart { get; set; }
        public DateTime? ActualEnd { get; set; }
        public int? ApprovedBy { get; set; }
        public int? IssuedBy { get; set; }
        public int? TakenBackBy { get; set; }
        public int CarId { get; set; }
        public int PickUpDepotId { get; set; }
        public int? ReturnDepotId { get; set; }
        public decimal? StartingKilometer { get; set; }
        public decimal? EndingKilometer { get; set; }
        public bool InvoiceRequest { get; set; }
        public DateTime? IssuedAt { get; set; }
        public decimal? TotalCost { get; set; }
        public int? ReceiptId { get; set; }

        public User Renter { get; set; }
        public User ApproverOperator { get; set; }
        public User IssuerOperator { get; set; }
        public User RecipientOperator { get; set; }
        public Car Car { get; set; }
        public Receipt Receipt { get; set; }
        public Depot PickUpDepot { get; set; }
        public Depot ReturnDepot { get; set; }
    }
}