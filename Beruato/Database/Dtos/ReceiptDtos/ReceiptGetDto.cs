using Database.Dtos.UserDtos;

namespace Database.Dtos.ReceiptDtos;

public class ReceiptGetDto
{
    public int Id { get; set; }
    public int RentId { get; set; }
    public decimal TotalCost { get; set; }
    public DateTime IssueDate { get; set; }
    public UserSimpleGetDto Issuer { get; set; }
}