using Database.Models;

namespace Database.Dtos.CarDtos;

public class CarSimpleGetDto
{
    public int Id { get; set; }
    public string Brand { get; set; }
    public string Model { get; set; }
    public string LicencePlate { get; set; }
    public FuelType FuelType { get; set; }
    public bool IsAutomatic { get; set; }
}