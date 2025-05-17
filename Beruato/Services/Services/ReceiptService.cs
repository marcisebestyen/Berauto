using AutoMapper;
using Database.Dtos.ReceiptDtos;
using Database.Models;
using Database.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Services.Repositories;

namespace Services.Services;

public interface IReceiptService
{
    Task<ReceiptGetDto?> GetReceiptByIdAsync(int receiptId);
    Task<CreateResult<ReceiptGetDto>> CreateReceiptAsync(ReceiptCreateDto receiptDto);
}

public class ReceiptService : IReceiptService
{
    protected readonly IUnitOfWork _unitOfWork;
    protected readonly IMapper _mapper;
    protected readonly ILogger<ReceiptService> _logger;

    public ReceiptService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<ReceiptService> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<ReceiptGetDto?> GetReceiptByIdAsync(int receiptId)
    {
        var receipt = await _unitOfWork.ReceiptRepository.GetByIdAsync(new object[] { receiptId });

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

        var rentExists = await _unitOfWork.RentRepository.GetByIdAsync(new object[] { createDto.RentId });
        if (rentExists == null)
        {
            _logger.LogWarning("Attempted to create receipt for non-existing RentId: {RentId}", createDto.RentId);
            return CreateResult<ReceiptGetDto>.Failure($"A(z) {createDto.RentId} azonosítójú bérlés nem található.");
        }

        var issuerExists = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { createDto.IssuedById });
        if (issuerExists == null)
        {
            _logger.LogWarning("Attempted to create receipt with non-existing IssuerId: {IssuerId}",
                createDto.IssuedById);
            return CreateResult<ReceiptGetDto>.Failure(
                $"A(z) {createDto.IssuedById} azonosítójú kiállító operátor nem található.");
        }

        var existingReceiptForRent = (await _unitOfWork.ReceiptRepository.GetAsync(r => r.RentId == createDto.RentId))
            .FirstOrDefault();
        if (existingReceiptForRent != null)
        {
            _logger.LogWarning("Receipt already exists for RentId: {RentId}. Existing ReceiptId: {ExistingReceiptId}",
                createDto.RentId, existingReceiptForRent.Id);
            return CreateResult<ReceiptGetDto>.Failure(
                $"Ehhez a bérléshez (RentId: {createDto.RentId}) már létezik számla (ReceiptId: {existingReceiptForRent.Id}).");
        }

        var newReceipt = _mapper.Map<Receipt>(createDto);

        try
        {
            await _unitOfWork.ReceiptRepository.InsertAsync(newReceipt);
            await _unitOfWork.SaveAsync();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error occurred while creating a new receipt for RentId: {RentId}.",
                createDto.RentId);
            return CreateResult<ReceiptGetDto>.Failure(
                $"Adatbázis hiba történt a számla létrehozása során: {ex.InnerException?.Message ?? ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred while creating a new receipt for RentId: {RentId}.",
                createDto.RentId);
            return CreateResult<ReceiptGetDto>.Failure(
                $"Váratlan hiba történt a számla létrehozása során: {ex.Message}");
        }

        // A létrehozott Receipt entitásból egyszerűen mappelünk ReceiptGetDto-ra.
        // Az IssuerName-t már nem kell külön kitölteni.
        var createdReceiptDto = _mapper.Map<ReceiptGetDto>(newReceipt);

        _logger.LogInformation("Receipt with ID {ReceiptId} created successfully for RentId: {RentId}.", newReceipt.Id,
            newReceipt.RentId);
        return CreateResult<ReceiptGetDto>.Success(createdReceiptDto);
    }
}