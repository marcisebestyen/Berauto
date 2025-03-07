namespace Database.Models
{
    public enum RequiredLicence
    {
        AM,
        A1,
        A2,
        A,
        B
    }

    public enum FuelType
    {
        Diesel, 
        Petrol,
        Hybrid,
        Electric 
    }

    public class Car
    {
        public int Id { get; set; }
        public bool IsAvailable { get; set; } = true;
        public RequiredLicence Licence { get; set; } = RequiredLicence.B;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string LicencePlate { get; set; } = string.Empty;
        public bool HaveValidVignette { get; set; } = false;
        public decimal Price { get; set; }
        public int Seats { get; set; }
        public FuelType FuelType { get; set; }
        public bool IsAutomaticTransmission { get; set; } = false; // false = manual, true = automatic 
        public decimal Trunk { get; set; }
    }
}
