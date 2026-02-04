using System.ComponentModel.DataAnnotations;

namespace Database.Dtos.RentDtos;

public class RentUpdateByStaffDto
{
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public int? ApprovedById { get; set; }
    public int? IssuedById { get; set; }
    public int? TakenBackById { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "A kezdő kilométeróra állás nem lehet negatív.")]
    public decimal? StartingKilometer { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "A záró kilométeróra állás nem lehet negatív.")]
    public decimal? EndingKilometer { get; set; }

    public bool? InvoiceRequest { get; set; }
    public DateTime? IssuedAt { get; set; }
}