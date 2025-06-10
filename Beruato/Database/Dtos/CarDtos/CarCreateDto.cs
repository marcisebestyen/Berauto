using System.ComponentModel.DataAnnotations;
using Database.Models;

namespace Database.Dtos.CarDtos;

public class CarCreateDto
{
    [Required(ErrorMessage = "Az üzemanyag típus megadása kötelező.")]
    public FuelType FuelType { get; set; }

    [Required(ErrorMessage = "A szükséges jogosítvány kategória megadása kötelező.")]
    public RequiredLicence RequiredLicence { get; set; }

    [Required(ErrorMessage = "A rendszám megadása kötelező.")]
    [StringLength(15, ErrorMessage = "A rendszám maximum 15 karakter hosszú lehet.")]
    public string LicencePlate { get; set; }

    [Required(ErrorMessage = "Az érvényes matrica állapotának megadása kötelező.")]
    public bool HasValidVignette { get; set; }

    [Required(ErrorMessage = "A kilométerenkénti ár megadása kötelező.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "A kilométerenkénti árnak pozitívnak kell lennie.")]
    public decimal PricePerDay { get; set; }

    [Required(ErrorMessage = "Az automata váltó állapotának megadása kötelező.")]
    public bool IsAutomatic { get; set; }

    [Required(ErrorMessage = "Az aktuális kilométeróra állás megadása kötelező.")]
    [Range(0, double.MaxValue, ErrorMessage = "A kilométeróra állás nem lehet negatív.")]
    public decimal ActualKilometers { get; set; }
    
    [Required]
    public string Brand { get; set; }
     
    [Required]
    public string Model { get; set; }
}