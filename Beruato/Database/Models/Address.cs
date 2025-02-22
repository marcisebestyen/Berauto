namespace Database.Models
{
    public class Address
    {
        public int Id { get; set; }
        public string ZipCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public string Settlement { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string HouseNumber { get; set; } = string.Empty;
        public string? Floor { get; set; }
        public string? Door { get; set; }
    }
}
