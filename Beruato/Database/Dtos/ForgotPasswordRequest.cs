using System.ComponentModel.DataAnnotations;

namespace Database.Dtos;

public class ForgotPasswordRequestDto
{
    [Required(ErrorMessage = "Az e-mail cím megadása kötelező.")]
    [EmailAddress(ErrorMessage = "Érvénytelen e-mail cím formátum.")]
    public string Email { get; set; }
}