﻿namespace Database.Models
{
    public enum Role
    {
        User,
        Guest,
        Admin,
        Director
    }

    public class User
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int AddressId { get; set; }
        public Role Role { get; set; }
        public List<string> PhoneNumber { get; set; } = new();

        public Address Address { get; set; } = new();
    }
}
