using Database.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

public class CompanyInfo
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? TaxId { get; set; }
    public string? BankAccount { get; set; }
    public string? Email { get; set; }
}

public class InvoiceLineItem
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class Receipt
{
    public int Id { get; set; }

    public int RentId { get; set; }
    public int IssuedBy { get; set; }

    public decimal TotalCost { get; set; }
    public DateTime IssueDate { get; set; }

    public string InvoiceNumber { get; set; } = string.Empty;

    public string SellerInfoJson { get; set; } = "{}";
    public string BuyerInfoJson { get; set; } = "{}";
    public string LineItemsJson { get; set; } = "[]";

    [NotMapped]
    public CompanyInfo Seller
    {
        get => JsonSerializer.Deserialize<CompanyInfo>(SellerInfoJson) ?? new CompanyInfo();
        set => SellerInfoJson = JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public CompanyInfo Buyer
    {
        get => JsonSerializer.Deserialize<CompanyInfo>(BuyerInfoJson) ?? new CompanyInfo();
        set => BuyerInfoJson = JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<InvoiceLineItem> LineItems
    {
        get => JsonSerializer.Deserialize<List<InvoiceLineItem>>(LineItemsJson) ?? new List<InvoiceLineItem>();
        set => LineItemsJson = JsonSerializer.Serialize(value);
    }

    [ForeignKey(nameof(RentId))] public Rent Rent { get; set; }

    [ForeignKey(nameof(IssuedBy))] public User IssuerOperator { get; set; }
}