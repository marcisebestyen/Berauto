using System.ComponentModel.DataAnnotations;

namespace Database.Dtos;

public class PasswordResetRequest
{
    [Required(ErrorMessage = "A token megadása kötelező.")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Az új jelszó megadása kötelező.")]
    [MinLength(6, ErrorMessage = "A jelszónak legalább 6 karakter hosszúnak kell lennie.")]
    public string NewPassword { get; set; } = string.Empty;
}