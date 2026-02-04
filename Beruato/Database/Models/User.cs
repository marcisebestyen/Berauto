namespace Database.Models
{
    public enum Role
    {
        Renter,
        Staff,
        Admin
    }

    public class User
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string UserName { get; set; }
        public string Name => $"{FirstName} {LastName}";
        public string PhoneNumber { get; set; }
        public bool RegisteredUser { get; set; } = false;
        public string? LicenceId { get; set; } // pl. ABC123
        public Role Role { get; set; } = Role.Renter;
        public string? Email { get; set; }
        public string? Address { get; set; }

        public string? Password { get; set; }

        public ICollection<WaitingList> WaitingLists { get; set; } = new List<WaitingList>();
    }
}