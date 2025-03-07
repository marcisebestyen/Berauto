using Database.Models;

namespace Database.Dtos
{
    public class CarDto
    {
        public int Id { get; set; }
        public bool IsAvailable { get; set; } 
        public string Licence { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string LicencePlate { get; set; } = string.Empty;
        public bool HaveValidVignette { get; set; }
        public decimal Price { get; set; }
        public int Seats { get; set; }
        public string FuelType { get; set; } = string.Empty;
        public bool IsAutomaticTransmission { get; set; } 
        public decimal Trunk { get; set; }
    }

    public class CreateCarDto
    {
        public RequiredLicence Licence { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string LicencePlate { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Seats { get; set; }
        public FuelType FuelType { get; set; }
        public bool IsAutomaticTransmission { get; set; }
        public decimal Trunk { get; set; }
    }

    public class UpdateCarDto
    {
        public bool? IsAvailable { get; set; }
        public RequiredLicence? Licence { get; set; }
        public bool? HaveValidVignette { get; set; }
        public decimal? Price { get; set; }
    }

    public class ListCarDto
    {
        public int Id { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsAvailable { get; set; }
    }
}