namespace Database.Dtos.RentDtos;

public class RentGetDto
{
    public int Id { get; set; }
    public string RenterName { get; set; }
    public DateTime PlannedStart { get; set; }
    public DateTime PlannedEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public decimal? StartingKilometer { get; set; }
    public decimal? EndingKilometer { get; set; }
    public bool InvoiceRequest { get; set; }
    public DateTime? IssuedAt { get; set; }
    public bool Finished { get; set; }
    public int RenterId { get; set; }
    public int CarId { get; set; }
    public int? ApproverId { get; set; }
    public int? IssuerId { get; set; }
    public int? RecipientId { get; set; }

    // Autó adatok
    public string CarBrand { get; set; }
    public string CarModel { get; set; }
    public decimal? TotalCost { get; set; }
    public int? ReceiptId { get; set; }
}