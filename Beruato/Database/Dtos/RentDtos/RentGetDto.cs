using Database.Dtos.CarDtos;
using Database.Dtos.UserDtos;

namespace Database.Dtos.RentDtos;

public class RentGetDto
{
    public int Id { get; set; }
    public DateTime PlannedStart { get; set; }
    public DateTime PlannedEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public decimal? StartingKilometer { get; set; }
    public decimal? EndingKilometer { get; set; }
    public bool InvoiceRequest { get; set; }
    public DateTime? IssuedAt { get; set; } // Számla kiállítási dátuma (a bérléshez kapcsolódóan)

    // Kapcsolódó entitások egyszerűsített formában
    public UserSimpleGetDto Renter { get; set; }
    public CarSimpleGetDto Car { get; set; }
    public UserSimpleGetDto Approver { get; set; } // Lehet null, ha még nincs jóváhagyva
    public UserSimpleGetDto Issuer { get; set; }   // Lehet null, ha még nincs kiadva
    public UserSimpleGetDto Recipient { get; set; } // Lehet null, ha még nincs visszavéve
}