using System.ComponentModel.DataAnnotations;

namespace Database.Dtos;

public class ResetPasswordDto
{
    [Required(ErrorMessage = "Az e-mail cím megadása kötelező.")]
    [EmailAddress(ErrorMessage = "Érvénytelen e-mail cím formátum.")]
    public string Email { get; set; } // Az ellenőrzött e-mail cím
    
    [Required(ErrorMessage = "Az új jelszó megadása kötelező.")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "A jelszónak legalább 8 karakter hosszúnak kell lennie.")]
    // Itt további jelszó komplexitási szabályokat is megadhatsz (pl. Regex)
    public string NewPassword { get; set; }
}