using Database.Models;

namespace Database.Dtos.CarDtos;

public class CarGetDto
{
    public int Id { get; set; }
    public string Brand { get; set; }
    public string Model { get; set; }
    public FuelType FuelType { get; set; }
    public RequiredLicence RequiredLicence { get; set; }
    public string LicencePlate { get; set; }
    public bool HasValidVignette { get; set; }
    public decimal PricePerKilometer { get; set; }
    public bool IsAutomatic { get; set; }
    public decimal ActualKilometers { get; set; }
}