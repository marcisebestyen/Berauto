namespace Database.Dtos.UserDtos;

public class UserGetDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string UserName { get; set; }
    public string Name => $"{FirstName} {LastName}"; // Kliens oldalon is képezhető
    public string PhoneNumber { get; set; }
    public bool RegisteredUser { get; set; }
    public string LicenceId { get; set; }
    public string Email { get; set; } 
}