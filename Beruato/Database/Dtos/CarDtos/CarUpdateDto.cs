using System.ComponentModel.DataAnnotations;
using Database.Models;

namespace Database.Dtos.CarDtos;

public class CarUpdateDto
{
    public RequiredLicence? RequiredLicence { get; set; }

    [StringLength(15, ErrorMessage = "A rendszám maximum 15 karakter hosszú lehet.")]
    public string? LicencePlate { get; set; }
    
    public bool? HasValidVignette { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "A kilométerenkénti árnak pozitívnak kell lennie.")]
    public decimal? PricePerKilometer { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "A kilométeróra állás nem lehet negatív.")]
    public decimal? ActualKilometers { get; set; }
    
    public bool? InProperCondition { get; set; }
}