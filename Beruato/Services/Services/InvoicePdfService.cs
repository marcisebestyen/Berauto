using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.IO;
using System.Collections.Generic;
using Database.Models;

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
        // A QuestPDF licenc beállítása.
        // Kereskedelmi projektekhez kereskedelmi licenc szükséges.
        // Nem kereskedelmi használatra az alábbi sorral beállítható a Community licenc.
        // Helyezd ezt a beállítást az alkalmazás indulásakor egy helyre (pl. Program.cs vagy Startup.cs).
        // QuestPDF.Settings.License = LicenseType.Community;
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

                // Fejléc
                page.Header()
                    .Text($"SZÁMLA #{receiptData.InvoiceNumber}")
                    .SemiBold().FontSize(20).AlignCenter();

                // Tartalom
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

                            // Vevő adatai
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

                        // Számla részletei (dátum)
                        column.Item().PaddingTop(10).Text($"Kiállítás dátuma: {receiptData.IssueDate.ToShortDateString()}");

                        // Tételek táblázata
                        column.Item().Table(table =>
                        {
                            // Oszlopok definíciója
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3); // Leírás (szélesebb)
                                columns.RelativeColumn();   // Mennyiség
                                columns.RelativeColumn();   // Egységár
                                columns.RelativeColumn();   // Összesen (tétel)
                            });

                            // Táblázat fejléc
                            table.Header(header =>
                            {
                                header.Cell().Text("Leírás").SemiBold();
                                header.Cell().Text("Mennyiség").SemiBold();
                                header.Cell().Text("Egységár").SemiBold();
                                header.Cell().Text("Összesen").SemiBold();
                            });

                            // Tételek hozzáadása
                            foreach (var item in receiptData.LineItems)
                            {
                                table.Cell().Text(item.Description);
                                table.Cell().Text(item.Quantity.ToString());
                                table.Cell().Text($"{item.UnitPrice:N0} Ft"); // Formázás pénznemre
                                table.Cell().Text($"{item.LineTotal:N0} Ft");
                            }

                            // Bruttó összeg
                            table.Cell().ColumnSpan(3).AlignRight().Text("Fizetendő összesen:").SemiBold();
                            table.Cell().Text($"{receiptData.TotalCost:N0} Ft").SemiBold();
                        });

                        // Egyéb megjegyzések (opcionális)
                        column.Item().PaddingTop(10).Text("Köszönjük, hogy minket választott!");
                    });

                // Lábléc
                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Oldal ");
                        x.CurrentPageNumber(); // Aktuális oldalszám
                        x.Span(" / ");
                        x.TotalPages(); // Összes oldalszám
                    });
            });
        });
        return document.GeneratePdf();
    }
}

