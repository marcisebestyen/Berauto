using Database.Dtos.UserDtos;

namespace Database.Dtos.ReceiptDtos;

public class ReceiptGetDto
{
    public int Id { get; set; }
    public int RentId { get; set; }
    public decimal TotalCost { get; set; }
    public DateTime IssueDate { get; set; }

    public int IssuedById { get; set; }
    public string IssuerName { get; set; }
    public string CarBrand { get; set; }
    public string CarModel { get; set; }

    public DateTime PlannedStart { get; set; }
    public DateTime PlannedEnd { get; set; }

    public string RenterName { get; set; }
}