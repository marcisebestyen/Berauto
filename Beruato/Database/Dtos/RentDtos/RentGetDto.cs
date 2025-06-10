using Database.Dtos.CarDtos;
using Database.Dtos.UserDtos;

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
    public DateTime? IssuedAt { get; set; } // Számla kiállítási dátuma (a bérléshez kapcsolódóan)

    // Kapcsolódó entitások egyszerűsített formában
    public int RenterId { get; set; }
    public int CarId { get; set; }
    public int? ApproverId { get; set; } // Lehet null, ha még nincs jóváhagyva
    public int? IssuerId { get; set; }   // Lehet null, ha még nincs kiadva
    public int? RecipientId { get; set; } // Lehet null, ha még nincs visszavéve

    //autó adatok
    public string CarBrand { get; set; }
    public string CarModel { get; set; }
}