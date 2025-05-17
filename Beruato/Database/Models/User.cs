namespace Database.Models
{
    public enum Role
    {
        Renter, // bérlők
        Staff, // ügyintéző
        Admin // adminisztrátor
    }
    
    public class User
    {
        // minden userhez 
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string UserName { get; set; }
        public string Name => $"{FirstName} {LastName}";
        public string PhoneNumber { get; set; }
        public bool RegisteredUser { get; set; } = false;
        public string? LicenceId { get; set; } // pl. ABC123
        public Role Role { get; set; } = Role.Renter;
        public string Email { get; set; }

        // regisztrált userekhez
        public string? Password { get; set; }
    }
}
/*
 * Address-t adhatunk hozzá, ha nagyon akarunk, de mivel nem írták
 * sehol, ezért szerintem nem releváns
 */
