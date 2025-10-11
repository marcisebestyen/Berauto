using System.ComponentModel.DataAnnotations;

namespace Database.Dtos;

public class InitiatePasswordResetRequest
{
    [Required(ErrorMessage = "Az e-mail cím megadása kötelező.")]
    [EmailAddress(ErrorMessage = "Érvénytelen e-mail formátum.")]
    public string Email { get; set; } = string.Empty;
}