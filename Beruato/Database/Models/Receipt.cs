using Database.Models;
using System.ComponentModel.DataAnnotations.Schema;

public class Receipt
{
    public int Id { get; set; }

    public int RentId { get; set; }
    public int IssuedBy { get; set; } 

    public decimal TotalCost { get; set; } 
    public DateTime IssueDate { get; set; }

    [ForeignKey(nameof(RentId))]
    public Rent Rent { get; set; }

    [ForeignKey(nameof(IssuedBy))]
    public User IssuerOperator { get; set; }
}
