namespace Database.Dtos.RentDtos
{
    public class GuestRentCreateDto
    {
        // Vendég adatai
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; } // Lehet opcionális
        public string LicenceId { get; set; }

        // Bérlés adatai
        public int CarId { get; set; }
        public DateTime PlannedStart { get; set; }
        public DateTime PlannedEnd { get; set; }
        public bool InvoiceRequest { get; set; }
    }
}