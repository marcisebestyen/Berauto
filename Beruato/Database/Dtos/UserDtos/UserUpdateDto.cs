using System.ComponentModel.DataAnnotations;

namespace Database.Dtos.UserDtos;

public class UserUpdateDto
{
    [StringLength(100, ErrorMessage = "A keresztnév maximum 100 karakter hosszú lehet.")]
    public string? FirstName { get; set; }

    [StringLength(100, ErrorMessage = "A vezetéknév maximum 100 karakter hosszú lehet.")]
    public string? LastName { get; set; }

    [StringLength(30, ErrorMessage = "A telefonszám maximum 30 karakter hosszú lehet.")]
    public string? PhoneNumber { get; set; }

    [StringLength(30, ErrorMessage = "A jogosítvány azonosító maximum 30 karakter hosszú lehet.")]
    public string? LicenceId { get; set; }

    [EmailAddress(ErrorMessage = "Érvénytelen e-mail cím formátum.")]
    [StringLength(255, ErrorMessage = "Az e-mail cím maximum 255 karakter hosszú lehet.")]
    public string? Email { get; set; }

    public string? Address { get; set; }
}