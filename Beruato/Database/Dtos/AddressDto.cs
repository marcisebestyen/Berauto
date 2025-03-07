using Database.Models;

namespace Database.Dtos
{
    public class AddressDto
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

    public class CreateAddressDto
    {
        public string ZipCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public string Settlement { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string HouseNumber { get; set; } = string.Empty;
        public string? Floor { get; set; }
        public string? Door { get; set; }
    }

    public class UpdateAddressDto
    {
        public string? ZipCode { get; set; }
        public string? Country { get; set; }
        public string? County { get; set; }
        public string? Settlement { get; set; }
        public string? Street { get; set; }
        public string? HouseNumber { get; set; }
        public string? Floor { get; set; }
        public string? Door { get; set; }
    }

    public class ListAddressDto
    {
        public int Id { get; set; }
        public string Country { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public string Settlement { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string HouseNumber { get; set; } = string.Empty;
    }
}