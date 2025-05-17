using System.ComponentModel.DataAnnotations;

namespace Database.Dtos.UserDtos;

public class UserLoginDto
{
    [Required(ErrorMessage = "A felhasználónév vagy e-mail cím megadása kötelező.")]
    public string Identifier { get; set; } // Ez lehet email vagy username

    [Required(ErrorMessage = "A jelszó megadása kötelező.")]
    public string Password { get; set; }
}