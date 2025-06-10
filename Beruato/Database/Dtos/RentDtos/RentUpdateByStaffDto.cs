using System.ComponentModel.DataAnnotations;

namespace Database.Dtos.RentDtos;

public class RentUpdateByStaffDto
{
    public DateTime? ActualStart { get; set; } // Autó kiadásakor
    public DateTime? ActualEnd { get; set; }   // Autó visszahozásakor
    public int? ApprovedById { get; set; }    // Jóváhagyó operátor ID-ja
    public int? IssuedById { get; set; }      // Kiadó operátor ID-ja (autó kiadásakor)
    public int? TakenBackById { get; set; }   // Visszavevő operátor ID-ja (autó visszahozásakor)
        
    [Range(0, double.MaxValue, ErrorMessage = "A kezdő kilométeróra állás nem lehet negatív.")]
    public decimal? StartingKilometer { get; set; } // Autó kiadásakor

    [Range(0, double.MaxValue, ErrorMessage = "A záró kilométeróra állás nem lehet negatív.")]
    public decimal? EndingKilometer { get; set; }   // Autó visszahozásakor
    // Validáció: EndingKilometer >= StartingKilometer

    public bool? InvoiceRequest { get; set; }
    public DateTime? IssuedAt { get; set; } // Számla kiállítási dátuma, ha a bérlés lezárásakor rögzítjük itt is
}