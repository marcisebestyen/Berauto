using System.ComponentModel.DataAnnotations;

namespace Database.Dtos;

public class WaitingListCreateDto
{
    [Required(ErrorMessage = "CarId is required.")]
    public int CarId { get; set; }

    public int UserId { get; set; }
}