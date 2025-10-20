using QuestPDF.Fluent;
using QuestPDF.Helpers;

namespace Services.Services;

public interface IInvoicePdfService
{
    /// <summary>
    /// Generál egy PDF számlát a megadott nyugta adatok alapján.
    /// </summary>
    /// <param name="receiptData">A nyugta adatai, kibővítve számla információkkal.</param>
    /// <returns>A generált PDF fájl bájtjai.</returns>
    byte[] GenerateInvoicePdf(Receipt receiptData);
}

public class InvoicePdfService : IInvoicePdfService
{
    public InvoicePdfService()
    {
    }

    public byte[] GenerateInvoicePdf(Receipt receiptData)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(50);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Text($"SZÁMLA #{receiptData.InvoiceNumber}")
                    .SemiBold().FontSize(20).AlignCenter();

                page.Content()
                    .PaddingVertical(10)
                    .Column(column =>
                    {
                        column.Spacing(10);

                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("Szállító adatai:").SemiBold();
                                col.Item().Text(receiptData.Seller.Name);
                                col.Item().Text(receiptData.Seller.Address);
                                if (!string.IsNullOrEmpty(receiptData.Seller.TaxId))
                                    col.Item().Text($"Adószám: {receiptData.Seller.TaxId}");
                                if (!string.IsNullOrEmpty(receiptData.Seller.BankAccount))
                                    col.Item().Text($"Bankszámlaszám: {receiptData.Seller.BankAccount}");
                                if (!string.IsNullOrEmpty(receiptData.Seller.Email))
                                    col.Item().Text($"E-mail: {receiptData.Seller.Email}");
                            });

                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("Vevő adatai:").SemiBold();
                                col.Item().Text(receiptData.Buyer.Name);
                                col.Item().Text(receiptData.Buyer.Address);
                                if (!string.IsNullOrEmpty(receiptData.Buyer.TaxId))
                                    col.Item().Text($"Adószám: {receiptData.Buyer.TaxId}");
                                if (!string.IsNullOrEmpty(receiptData.Buyer.Email))
                                    col.Item().Text($"E-mail: {receiptData.Buyer.Email}");
                            });
                        });

                        column.Item().PaddingTop(10)
                            .Text($"Kiállítás dátuma: {receiptData.IssueDate.ToShortDateString()}");

                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Leírás").SemiBold();
                                header.Cell().Text("Mennyiség").SemiBold();
                                header.Cell().Text("Egységár").SemiBold();
                                header.Cell().Text("Összesen").SemiBold();
                            });

                            foreach (var item in receiptData.LineItems)
                            {
                                table.Cell().Text(item.Description);
                                table.Cell().Text(item.Quantity.ToString());
                                table.Cell().Text($"{item.UnitPrice:N0} Ft");
                                table.Cell().Text($"{item.LineTotal:N0} Ft");
                            }

                            table.Cell().ColumnSpan(3).AlignRight().Text("Fizetendő összesen:").SemiBold();
                            table.Cell().Text($"{receiptData.TotalCost:N0} Ft").SemiBold();
                        });

                        column.Item().PaddingTop(10).Text("Köszönjük, hogy minket választott!");
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Oldal ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
            });
        });
        return document.GeneratePdf();
    }
}