using System.ComponentModel.DataAnnotations;

namespace Database.Dtos.ReceiptDtos;

public class UpdateReceiptDto
{
    [Range(0, double.MaxValue, ErrorMessage = "A teljes költség nem lehet negatív.")]
    public decimal? TotalCost { get; set; }
    public DateTime? IssueDate { get; set; }
}