using AutoMapper;
using Database.Dtos.ReceiptDtos;
using Database.Models;
using Database.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Services.Repositories;
using System.Net.Mail; // This using is for SmtpException, not for SmtpClient anymore

namespace Services.Services;

public interface IReceiptService
{
    Task<ReceiptGetDto?> GetReceiptByIdAsync(int receiptId);
    Task<CreateResult<ReceiptGetDto>> CreateReceiptAsync(ReceiptCreateDto receiptDto);
    Task<IEnumerable<ReceiptGetDto>> GetAllReceiptsAsync();
    Task<IEnumerable<ReceiptGetDto>> GetReceiptsByUserIdAsync(int userId);
}

public class ReceiptService : IReceiptService
{
    protected readonly IUnitOfWork _unitOfWork;
    protected readonly IMapper _mapper;
    protected readonly ILogger<ReceiptService> _logger;
    protected readonly IInvoicePdfService _invoicePdfService;
    protected readonly IEmailService _emailService;

    public ReceiptService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<ReceiptService> logger,
        IInvoicePdfService invoicePdfService,
        IEmailService emailService)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _invoicePdfService = invoicePdfService ?? throw new ArgumentNullException(nameof(invoicePdfService));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
    }

    public async Task<IEnumerable<ReceiptGetDto>> GetReceiptsByUserIdAsync(int userId)
    {
        var receipts = await _unitOfWork.ReceiptRepository.GetAsync(
            r => r.Rent.RenterId == userId || r.IssuedBy == userId,
            new[] { "Rent.Car", "Rent.Renter", "IssuerOperator" });

        return _mapper.Map<IEnumerable<ReceiptGetDto>>(receipts);
    }

    public async Task<IEnumerable<ReceiptGetDto>> GetAllReceiptsAsync()
    {
        var receipts = await _unitOfWork.ReceiptRepository.GetAllAsync(new[]
        {
            "Rent.Car",
            "Rent.Renter",
            "IssuerOperator"
        });

        if (receipts == null || !receipts.Any())
        {
            return Enumerable.Empty<ReceiptGetDto>();
        }
        return _mapper.Map<IEnumerable<ReceiptGetDto>>(receipts);
    }

    public async Task<ReceiptGetDto?> GetReceiptByIdAsync(int receiptId)
    {
        var receipt = await _unitOfWork.ReceiptRepository.GetByIdAsync(new object[] { receiptId }, new[]
        {
            "Rent.Car",
            "Rent.Renter",
            "IssuerOperator"
        });

        if (receipt == null)
        {
            return null;
        }

        return _mapper.Map<ReceiptGetDto>(receipt);
    }

    public async Task<CreateResult<ReceiptGetDto>> CreateReceiptAsync(ReceiptCreateDto createDto)
    {
        if (createDto == null)
        {
            return CreateResult<ReceiptGetDto>.Failure("A létrehozási adatok nem lehetnek üresek.");
        }

        var rentEntity = await _unitOfWork.RentRepository.GetByIdAsync(
            new object[] { createDto.RentId },
            new[] { "Car", "Renter" }
        );

        if (rentEntity == null)
        {
            _logger.LogWarning("Attempted to create receipt for non-existing RentId: {RentId}", createDto.RentId);
            return CreateResult<ReceiptGetDto>.Failure($"A(z) {createDto.RentId} azonosítójú bérlés nem található.");
        }

        var issuerOperator = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { createDto.IssuedById });
        if (issuerOperator == null)
        {
            _logger.LogWarning("Attempted to create receipt with non-existing IssuerId: {IssuerId}", createDto.IssuedById);
            return CreateResult<ReceiptGetDto>.Failure($"A(z) {createDto.IssuedById} azonosítójú kiállító operátor nem található.");
        }

        var existingReceiptForRent = (await _unitOfWork.ReceiptRepository.GetAsync(r => r.RentId == createDto.RentId)).FirstOrDefault();
        if (existingReceiptForRent != null)
        {
            _logger.LogWarning("Receipt already exists for RentId: {RentId}. Existing ReceiptId: {ExistingReceiptId}", createDto.RentId, existingReceiptForRent.Id);
            return CreateResult<ReceiptGetDto>.Failure($"Ehhez a bérléshez (RentId: {createDto.RentId}) már létezik számla (ReceiptId: {existingReceiptForRent.Id}).");
        }

        var newReceipt = _mapper.Map<Receipt>(createDto);

        rentEntity.IssuedAt = newReceipt.IssueDate;
        rentEntity.TotalCost = newReceipt.TotalCost;

        newReceipt.InvoiceNumber = $"SZAMLA-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

        newReceipt.Seller = new CompanyInfo
        {
            Name = "Autókölcsönző Kft.",
            Address = "1234 Budapest, Példa utca 1.",
            TaxId = "HU12345678",
            BankAccount = "12345678-87654321-12345678",
            Email = "info@autokolcsonzo.hu"
        };

        newReceipt.Buyer = new CompanyInfo
        {
            Name = rentEntity.Renter?.Name ?? "Ismeretlen Vevő",
            Address = rentEntity.Renter?.Address ?? "Ismeretlen Cím",
            TaxId = rentEntity.Renter?.LicenceId,
            Email = rentEntity.Renter?.Email
        };

        newReceipt.LineItems = new List<InvoiceLineItem>
        {
            new InvoiceLineItem
            {
                Description = $"Autóbérlés: {rentEntity.Car?.Brand} {rentEntity.Car?.Model} ({rentEntity.Car?.LicencePlate}) " +
                              $"- {rentEntity.PlannedStart.ToShortDateString()} - {rentEntity.PlannedEnd.ToShortDateString()}",
                Quantity = 1,
                UnitPrice = newReceipt.TotalCost,
                LineTotal = newReceipt.TotalCost
            }
        };

        try
        {
            await _unitOfWork.ReceiptRepository.InsertAsync(newReceipt);
            await _unitOfWork.SaveAsync();

            newReceipt.InvoiceNumber = $"SZAMLA-{newReceipt.Id:D6}";
            rentEntity.ReceiptId = newReceipt.Id;

            await _unitOfWork.ReceiptRepository.UpdateAsync(newReceipt);
            await _unitOfWork.RentRepository.UpdateAsync(rentEntity);
            await _unitOfWork.SaveAsync();

            byte[] pdfBytes = _invoicePdfService.GenerateInvoicePdf(newReceipt);

            // ÚJ NAPLÓZÁS: Ellenőrizzük a PDF bájtjainak méretét
            _logger.LogInformation("Generált PDF bájtjainak mérete: {PdfByteLength} byte.", pdfBytes?.Length ?? 0);


            string invoiceFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "Invoices");
            if (!Directory.Exists(invoiceFolderPath))
            {
                Directory.CreateDirectory(invoiceFolderPath);
            }
            string filePath = Path.Combine(invoiceFolderPath, $"Szamla-{newReceipt.InvoiceNumber}.pdf");
            await File.WriteAllBytesAsync(filePath, pdfBytes);
            _logger.LogInformation("Számla PDF generálva és mentve: {FilePath}", filePath);

            if (rentEntity.Renter != null && !string.IsNullOrWhiteSpace(rentEntity.Renter.Email))
            {
                var toEmail = rentEntity.Renter.Email;
                var subject = $"Az Ön számlája az autóbérlésről - Számlaszám: {newReceipt.InvoiceNumber}";
                var body = $"Tisztelt {rentEntity.Renter.Name},\n\nCsatoltan küldjük az autóbérlésről szóló számláját. Köszönjük, hogy minket választott!\n\nÜdvözlettel,\nAz Autókölcsönző Csapat";
                var attachmentFileName = $"Szamla_{newReceipt.InvoiceNumber}.pdf";

                await _emailService.SendEmailWithAttachmentAsync(toEmail, subject, body, pdfBytes, attachmentFileName);
            }
            else
            {
                _logger.LogWarning("Nem sikerült e-mailt küldeni a számláról, mert a bérlő e-mail címe hiányzik vagy érvénytelen (RentId: {RentId}).", createDto.RentId);
            }

        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Adatbázis hiba történt a számla létrehozása és a bérlés frissítése során (RentId: {RentId}).", createDto.RentId);
            return CreateResult<ReceiptGetDto>.Failure($"Adatbázis hiba történt a számla létrehozása során: {ex.InnerException?.Message ?? ex.Message}");
        }
        catch (SmtpException smtpEx)
        {
            _logger.LogError(smtpEx, "E-mail küldési hiba történt a számla generálása után (RentId: {RentId}): {Message}", createDto.RentId, smtpEx.Message);
            return CreateResult<ReceiptGetDto>.Failure($"A számla sikeresen létrejött, de hiba történt az e-mail küldése során: {smtpEx.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Váratlan hiba történt a számla létrehozása és a bérlés frissítése során (RentId: {RentId}).", createDto.RentId);
            return CreateResult<ReceiptGetDto>.Failure($"Váratlan hiba történt a számla létrehozása során: {ex.Message}");
        }

        var createdReceiptDto = _mapper.Map<ReceiptGetDto>(newReceipt);

        _logger.LogInformation("Számla (ID: {ReceiptId}) sikeresen létrehozva a bérléshez (RentId: {RentId}). A bérlés IssuedAt, TotalCost és ReceiptId adatai frissítve.", newReceipt.Id, newReceipt.RentId);
        return CreateResult<ReceiptGetDto>.Success(createdReceiptDto);
    }
}
