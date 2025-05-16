using System.ComponentModel.DataAnnotations;

namespace Database.Dtos.RentDtos;

public class RentCreateDto
{
    [Required(ErrorMessage = "A bérlő azonosítójának megadása kötelező.")]
    public int RenterId { get; set; }

    [Required(ErrorMessage = "Az autó azonosítójának megadása kötelező.")]
    public int CarId { get; set; }

    [Required(ErrorMessage = "A tervezett kezdési időpont megadása kötelező.")]
    public DateTime PlannedStart { get; set; }

    [Required(ErrorMessage = "A tervezett befejezési időpont megadása kötelező.")]
    public DateTime PlannedEnd { get; set; }
    // Validáció: PlannedEnd > PlannedStart

    public bool InvoiceRequest { get; set; } = false;
}