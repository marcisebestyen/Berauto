namespace Database.Models
{
    public class Rent
    {
        public int Id { get; set; }
        public int RenterId { get; set; }
        public DateTime PlannedStart { get; set; } // user adja le igénynél
        public DateTime PlannedEnd { get; set; } // -,,-
        public DateTime? ActualStart { get; set; } // autó kiadásakor
        public DateTime? ActualEnd { get; set; } // autó visszahozása
        public int? ApprovedBy { get; set; } // staff id-ja
        public int? IssuedBy { get; set; } // -,,-
        public int? TakenBackBy { get; set; } // -,,-
        public int CarId { get; set; } // szabad autók listájából
        public decimal? StartingKilometer { get; set; }
        public decimal? EndingKilometer { get; set; }
        public bool InvoiceRequest { get; set; }
        public DateTime? IssuedAt { get; set; } // visszaírjuk Recepit-ből (dátumot)
    
        public User Renter { get; set; }
        public User ApproverOperator { get; set; }
        public User IssuerOperator { get; set; }
        public User RecipientOperator { get; set; }
        public Car Car { get; set; }    
    }
}
