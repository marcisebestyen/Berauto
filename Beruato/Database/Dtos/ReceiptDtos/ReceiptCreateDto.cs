using System.ComponentModel.DataAnnotations;

namespace Database.Dtos.ReceiptDtos;

public class ReceiptCreateDto
{
    [Required(ErrorMessage = "A kapcsolódó bérlés azonosítójának megadása kötelező.")]
    public int RentId { get; set; }

    [Required(ErrorMessage = "A teljes költség megadása kötelező.")]
    [Range(0, double.MaxValue, ErrorMessage = "A teljes költség nem lehet negatív.")]
    public decimal TotalCost { get; set; } // Ezt lehet, hogy a szerver oldalon kellene számolni

    [Required(ErrorMessage = "A kiállítás dátumának megadása kötelező.")]
    public DateTime IssueDate { get; set; }

    [Required(ErrorMessage = "A kiállító operátor azonosítójának megadása kötelező.")]
    public int IssuedById { get; set; }
}