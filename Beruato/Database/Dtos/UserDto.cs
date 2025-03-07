using Database.Models;


namespace Database.Dtos
{
    public class UserDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public AddressDto Address { get; set; } = new();
        public Role Role { get; set; }
        public List<string> PhoneNumber { get; set; } = new();
    }

    public class CreateUserDto
    {
        public string UserName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int AddressId { get; set; }
        public Role Role { get; set; }
        public List<string> PhoneNumber { get; set; } = new();
    }

    public class UpdateUserDto
    {
        public string? UserName { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public int? AddressId { get; set; }
        public List<string>? PhoneNumber { get; set; }
    }

    public class ListUserDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public Role Role { get; set; }
    }

}
