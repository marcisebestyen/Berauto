using System.ComponentModel.DataAnnotations;

namespace Database.Dtos.DepotDtos;

public class DepotCreateDto
{
    [Required]
    public string Name { get; set; }
    [Required]
    public string ZipCode { get; set; }
    [Required]
    public string City { get; set; }
    [Required]
    public string Street { get; set; }
    [Required]
    public string HouseNumber { get; set; }
}