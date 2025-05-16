using System.ComponentModel.DataAnnotations;
using Database.Models;

namespace Database.Dtos.CarDtos;

public class CarUpdateDto
{
    [MaxLength(50, ErrorMessage = "A márka maximum 50 karakter hosszú lehet.")]
    public string? Brand { get; set; }

    [MaxLength(50, ErrorMessage = "A modell maximum 50 karakter hosszú lehet.")]
    public string? Model { get; set; }
    public FuelType? FuelType { get; set; }
    public RequiredLicence? RequiredLicence { get; set; }

    [StringLength(15, ErrorMessage = "A rendszám maximum 15 karakter hosszú lehet.")]
    public string LicencePlate { get; set; }
    public bool? HasValidVignette { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "A kilométerenkénti árnak pozitívnak kell lennie.")]
    public decimal? PricePerKilometer { get; set; }
    public bool? IsAutomatic { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "A kilométeróra állás nem lehet negatív.")]
    public decimal? ActualKilometers { get; set; }
}