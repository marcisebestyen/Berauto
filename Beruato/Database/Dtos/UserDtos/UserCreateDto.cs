using System.ComponentModel.DataAnnotations;

namespace Database.Dtos.UserDtos;

public class UserCreateDto
{
    [Required(ErrorMessage = "A keresztnév megadása kötelező.")]
    [StringLength(100, ErrorMessage = "A keresztnév maximum 100 karakter hosszú lehet.")]
    public string FirstName { get; set; }

    [Required(ErrorMessage = "A vezetéknév megadása kötelező.")]
    [StringLength(100, ErrorMessage = "A vezetéknév maximum 100 karakter hosszú lehet.")]
    public string LastName { get; set; }

    [StringLength(30, ErrorMessage = "A telefonszám maximum 30 karakter hosszú lehet.")]
    public string PhoneNumber { get; set; } 

    [StringLength(30, ErrorMessage = "A jogosítvány azonosító maximum 30 karakter hosszú lehet.")]
    public string LicenceId { get; set; } 

    [EmailAddress(ErrorMessage = "Érvénytelen e-mail cím formátum.")]
    [StringLength(255, ErrorMessage = "Az e-mail cím maximum 255 karakter hosszú lehet.")]
    public string Email { get; set; } // Nullázható, de regisztrált felhasználónál érdemes megkövetelni

    [StringLength(255, MinimumLength = 6, ErrorMessage = "A jelszónak legalább 6 karakter hosszúnak kell lennie.")]
    public string Password { get; set; } // Nullázható, de regisztrált felhasználónál érdemes megkövetelni
    public string Address { get; set; } // Nullázható, de regisztrált felhasználónál érdemes megkövetelni
}