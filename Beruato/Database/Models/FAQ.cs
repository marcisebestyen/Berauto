using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("FAQs")]
public class Faq
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Question { get; set; }

    [Required]
    public string Answer { get; set; }

    public byte[] Vector { get; set; }
}