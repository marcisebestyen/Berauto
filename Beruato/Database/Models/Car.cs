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
        Diesel, // TDI for life
        Petrol,
        Hybrid,
        Electric // shittiest ever
    }

    public class Car
    {
        public int Id { get; set; }
        public bool IsAvailable { get; set; }
        public RequiredLicence Licence { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string LicencePlate { get; set; } = string.Empty;
        public bool HaveValidVignette { get; set; }
        public decimal Price { get; set; }
        public int EngineSize { get; set; }
        public int HorsePower { get; set; }
        public int Seats { get; set; }
        public FuelType FuelType { get; set; }
        public bool IsAutomaticTransmission { get; set; } = false; // false = manual, true = automatic 
        public double Trunk { get; set; }
    }
}
