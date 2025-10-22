using AutoMapper;
using Database.Dtos.RentDtos;
using Services.Repositories;
using Microsoft.Extensions.Logging;
using Database.Results;
using Database.Dtos.ReceiptDtos;
using Database.Models;
using Microsoft.Extensions.Options;
using Services.Configurations;

namespace Services.Services
{
    public interface IStaffService
    {
        Task<RentGetDto> ApprovedBy(int staffId, int rentId);
        Task<RentGetDto> IssuedBy(int staffId, int rentId, DateTime actualStart);
        Task<RentGetDto> TakenBackBy(int staffId, int rentId, DateTime actualEnd, decimal endingKilometer);
        Task<ServiceResult> RejectRentAsync(int staffId, int rentId, string? reason);
    }

    public class StaffService : IStaffService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<StaffService> _logger;
        private readonly IReceiptService _receiptService;
        private readonly IRentService _rentService;
        private readonly IEmailService _emailService;
        private readonly MailSettings _mailSettings;

        private const string _satisfactionSurveyUrl =
            "https://docs.google.com/forms/d/e/1FAIpQLSfurfBtlw_PvUSYqMQ4DuVF1DwMkFWmS-KkRH46d3utB2P0pA/viewform?usp=header";

        public StaffService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<StaffService> logger,
            IReceiptService receiptService,
            IRentService rentService,
            IEmailService emailService,
            IOptions<MailSettings> mailSettings)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _receiptService = receiptService ?? throw new ArgumentNullException(nameof(receiptService));
            _rentService = rentService ?? throw new ArgumentNullException(nameof(rentService));
            _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
            _mailSettings = mailSettings.Value ?? throw new ArgumentNullException(nameof(mailSettings));
        }

        public async Task<RentGetDto> ApprovedBy(int staffId, int rentId)
        {
            var staffUser = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
            if (staffUser == null || (staffUser.Role != Role.Staff && staffUser.Role != Role.Admin))
            {
                _logger.LogWarning("Approve failed: User {StaffId} not found or not authorized.", staffId);
                throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff/admin.");
            }

            var rent = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rentId,
                includeProperties: new[] { "Car", "Renter" })).FirstOrDefault();

            if (rent == null)
            {
                _logger.LogWarning("Approve failed: Rent with ID {RentId} not found.", rentId);
                throw new KeyNotFoundException($"Rent with id {rentId} not found.");
            }

            if (rent.ApprovedBy.HasValue)
            {
                _logger.LogInformation("Rent ID {RentId} was already approved by Staff ID {ApproverId}.", rentId,
                    rent.ApprovedBy.Value);
                var alreadyApprovedRent = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rent.Id,
                    includeProperties: new[] { "Car", "Renter", "Receipt" })).FirstOrDefault();
                return _mapper.Map<RentGetDto>(alreadyApprovedRent);
            }

            rent.ApprovedBy = staffId;

            if (rent.InvoiceRequest)
            {
                decimal calculatedTotalCost = 0m;

                if (rent.Car != null && rent.Car.PricePerDay > 0)
                {
                    if (rent.PlannedEnd >= rent.PlannedStart)
                    {
                        TimeSpan duration = rent.PlannedEnd - rent.PlannedStart;
                        double totalDays = duration.TotalDays;

                        decimal billableDays = (decimal)Math.Max(1.0, Math.Ceiling(totalDays));

                        calculatedTotalCost = billableDays * rent.Car.PricePerDay;

                        _logger.LogInformation(
                            "Calculated TotalCost for Rent ID {RentId}: {BillableDays} days * {PricePerDay} PricePerDay = {CalculatedTotalCost}",
                            rent.Id, billableDays, rent.Car.PricePerDay, calculatedTotalCost);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Cannot calculate TotalCost for Rent ID {RentId}: PlannedEnd ({PlannedEnd}) is before PlannedStart ({PlannedStart}). Cost set to 0.",
                            rent.Id, rent.PlannedEnd, rent.PlannedStart);
                    }
                }
                else
                {
                    _logger.LogWarning(
                        "Cannot calculate TotalCost for Rent ID {RentId}: Car data is missing, or PricePerDay is not greater than 0. Car ID: {CarId}, PricePerDay on Car: {PricePerDayOnCar}. Cost set to 0.",
                        rent.Id, rent.Car?.Id, rent.Car?.PricePerDay);
                }

                var receiptCreateDto = new ReceiptCreateDto
                {
                    RentId = rent.Id,
                    TotalCost = calculatedTotalCost,
                    IssueDate = DateTime.UtcNow,
                    IssuedById = staffId
                };
                var receiptResult = await _receiptService.CreateReceiptAsync(receiptCreateDto);

                if (receiptResult.Succeeded && receiptResult.Resource != null)
                {
                    rent.ReceiptId = receiptResult.Resource.Id;
                    rent.IssuedAt = receiptResult.Resource.IssueDate;
                    rent.TotalCost = receiptResult.Resource.TotalCost;

                    _logger.LogInformation(
                        "Receipt created with ID {ReceiptId} for Rent ID {RentId}. Rent details (ReceiptId, IssuedAt, TotalCost) updated in memory.",
                        receiptResult.Resource.Id, rent.Id);
                }
                else
                {
                    _logger.LogError(
                        "Failed to create receipt for Rent ID {RentId} after approval. Errors: {Errors}",
                        rent.Id, string.Join(", ", receiptResult.Errors ?? new List<string>()));
                }
            }

            await _unitOfWork.RentRepository.UpdateAsync(rent);
            await _unitOfWork.SaveAsync();

            _logger.LogInformation("Rent ID {RentId} approved by Staff ID {StaffId}. All changes saved.", rentId,
                staffId);

            var updatedRentWithIncludes = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rent.Id,
                includeProperties: new[] { "Car", "Renter", "Receipt" })).FirstOrDefault();
            return _mapper.Map<RentGetDto>(updatedRentWithIncludes);
        }

        public async Task<ServiceResult> RejectRentAsync(int staffId, int rentId, string? reason)
        {
            var staffUser = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
            if (staffUser == null || (staffUser.Role != Role.Staff && staffUser.Role != Role.Admin))
            {
                _logger.LogWarning("Reject failed: User {StaffId} not found or not authorized.", staffId);
                return ServiceResult.Failed($"User with id {staffId} not found or user is not staff/admin.");
            }

            var rent = await _unitOfWork.RentRepository.GetByIdAsync(new object[] { rentId });
            if (rent == null)
            {
                _logger.LogWarning("Reject failed: Rent with ID {RentId} not found.", rentId);
                return ServiceResult.Failed($"Rent with id {rentId} not found.");
            }

            if (rent.ActualStart.HasValue)
            {
                _logger.LogWarning(
                    "Reject failed: Rent ID {RentId} has already started and cannot be rejected by deletion.", rentId);
                return ServiceResult.Failed("Ez a bérlés már elkezdődött, nem törölhető elutasítással.");
            }

            if (rent.ApprovedBy.HasValue)
            {
                _logger.LogWarning(
                    "Reject failed: Rent ID {RentId} has already been approved. Rejection by deletion is not allowed.",
                    rentId);
                return ServiceResult.Failed(
                    "Ez a bérlés már jóvá lett hagyva. A törléséhez/elutasításához más eljárás lehet szükséges.");
            }

            try
            {
                await _unitOfWork.RentRepository.DeleteAsync(rent.Id);
                await _unitOfWork.SaveAsync();
                _logger.LogInformation(
                    "Rent ID {RentId} rejected (deleted) by Staff ID {StaffId}. Reason (logged, not stored): {Reason}",
                    rentId, staffId, reason ?? "N/A");
                return ServiceResult.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting Rent ID {RentId} during rejection by Staff ID {StaffId}.", rentId,
                    staffId);
                return ServiceResult.Failed("Hiba történt a bérlési igény törlése (elutasítása) során.");
            }
        }

        public async Task<RentGetDto> IssuedBy(int staffId, int rentId, DateTime actualStart)
        {
            var staffUser = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
            if (staffUser == null || (staffUser.Role != Role.Staff && staffUser.Role != Role.Admin))
            {
                throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff/admin.");
            }

            var rent = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rentId,
                includeProperties: new[] { "Car" })).FirstOrDefault();
            if (rent == null)
            {
                throw new KeyNotFoundException($"Rent with id {rentId} not found.");
            }

            if (rent.Car == null)
            {
                throw new InvalidOperationException($"Car data not loaded for Rent with id {rentId}.");
            }

            if (!rent.ApprovedBy.HasValue)
            {
                throw new InvalidOperationException(
                    $"Rent with id {rentId} has not been approved yet and cannot be issued.");
            }

            if (rent.ActualStart.HasValue)
            {
                throw new InvalidOperationException(
                    $"Rent with id {rentId} has already been issued on {rent.ActualStart.Value}.");
            }

            if (rent.Car.IsRented)
            {
                throw new InvalidOperationException(
                    $"Car with ID {rent.Car.Id} is already rented and cannot be issued.");
            }

            rent.StartingKilometer = rent.Car.ActualKilometers;
            rent.IssuedBy = staffId;
            rent.ActualStart = actualStart;

            rent.Car.IsRented = true;

            try
            {
                await _unitOfWork.RentRepository.UpdateAsync(rent);
                await _unitOfWork.SaveAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during issuing car for Rent ID {RentId}", rentId);
                throw;
            }

            var updatedRentWithIncludes = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rent.Id,
                includeProperties: new[] { "Car", "Renter", "Receipt" })).FirstOrDefault();
            return _mapper.Map<RentGetDto>(updatedRentWithIncludes);
        }

        public async Task<RentGetDto> TakenBackBy(int staffId, int rentId, DateTime actualEnd, decimal endingKilometer)
        {
            var staffUser = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
            if (staffUser == null || (staffUser.Role != Role.Staff && staffUser.Role != Role.Admin))
            {
                throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff/admin.");
            }

            var rent = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rentId,
                includeProperties: new[] { "Car", "Renter", "Receipt" })).FirstOrDefault();

            if (rent == null)
            {
                throw new KeyNotFoundException($"Rent with id {rentId} not found.");
            }

            if (rent.Car == null)
            {
                throw new InvalidOperationException($"Car data not loaded for Rent with id {rentId}.");
            }

            if (!rent.ActualStart.HasValue)
            {
                throw new InvalidOperationException(
                    $"Rent with id {rentId} cannot be taken back as it was not issued yet.");
            }

            if (rent.ActualEnd.HasValue)
            {
                throw new InvalidOperationException(
                    $"Rent with id {rentId} has already been taken back on {rent.ActualEnd.Value}.");
            }

            if (rent.StartingKilometer.HasValue && endingKilometer < rent.StartingKilometer.Value)
            {
                throw new InvalidOperationException(
                    $"Ending kilometer ({endingKilometer}) cannot be less than starting kilometer ({rent.StartingKilometer.Value}).");
            }

            if (!rent.Car.IsRented)
            {
                _logger.LogWarning(
                    "Car with ID {CarId} for Rent ID {RentId} is not marked as rented but is being taken back.",
                    rent.Car.Id, rentId);
            }

            rent.TakenBackBy = staffId;
            rent.ActualEnd = actualEnd;
            rent.EndingKilometer = endingKilometer;

            decimal finalTotalCost = rent.TotalCost ?? 0m;

            if (rent.Car.PricePerDay > 0 && rent.ActualStart.HasValue && rent.ActualEnd.HasValue)
            {
                if (rent.ActualEnd.Value >= rent.ActualStart.Value)
                {
                    TimeSpan actualDuration = rent.ActualEnd.Value - rent.ActualStart.Value;
                    double totalActualDays = actualDuration.TotalDays;

                    decimal billableActualDays = (decimal)Math.Max(1.0, Math.Ceiling(totalActualDays));

                    finalTotalCost = billableActualDays * rent.Car.PricePerDay;

                    _logger.LogInformation(
                        "Calculated final TotalCost for Rent ID {RentId}: {BillableActualDays} actual days * {PricePerDay} PricePerDay = {FinalTotalCost}",
                        rent.Id, billableActualDays, rent.Car.PricePerDay, finalTotalCost);
                }
                else
                {
                    _logger.LogWarning(
                        "Cannot calculate final TotalCost for Rent ID {RentId}: ActualEnd ({ActualEnd}) is before ActualStart ({ActualStart}). Using previously calculated or default cost.",
                        rent.Id, rent.ActualEnd.Value, rent.ActualStart.Value);
                }
            }
            else
            {
                _logger.LogWarning(
                    "Could not recalculate TotalCost for Rent ID {RentId} based on PricePerDay due to missing data (ActualStart, ActualEnd, or PricePerDay <= 0). Using previously calculated or default cost. Car.PricePerDay: {CarPricePerDay}",
                    rentId, rent.Car.PricePerDay);
            }

            rent.TotalCost = finalTotalCost;
            rent.Car.ActualKilometers = endingKilometer;

            if (rent.ReceiptId.HasValue)
            {
                if (rent.Receipt != null)
                {
                    rent.Receipt.TotalCost = finalTotalCost;
                    await _unitOfWork.ReceiptRepository.UpdateAsync(rent.Receipt);
                    _logger.LogInformation(
                        "Receipt ID {ReceiptId} updated with final TotalCost {TotalCost} for Rent ID {RentId}.",
                        rent.Receipt.Id, finalTotalCost, rentId);
                }
                else
                {
                    var receiptToUpdate =
                        await _unitOfWork.ReceiptRepository.GetByIdAsync(new object[] { rent.ReceiptId.Value });
                    if (receiptToUpdate != null)
                    {
                        receiptToUpdate.TotalCost = finalTotalCost;
                        await _unitOfWork.ReceiptRepository.UpdateAsync(receiptToUpdate);
                        _logger.LogInformation(
                            "Receipt ID {ReceiptId} (fetched separately) updated with final TotalCost {TotalCost} for Rent ID {RentId}.",
                            receiptToUpdate.Id, finalTotalCost, rentId);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Receipt with ID {ReceiptIdValue} not found for Rent ID {RentId} during TakeBack. Cannot update receipt total cost.",
                            rent.ReceiptId.Value, rentId);
                    }
                }
            }

            rent.Car.IsRented = false;

            try
            {
                await _unitOfWork.RentRepository.UpdateAsync(rent);
                await _unitOfWork.CarRepository.UpdateAsync(rent.Car);
                await _unitOfWork.SaveAsync();

                await _rentService.HandleRentCompletion(rentId);

                await SendSatisfactionSurvey(rent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during taking back car for Rent ID {RentId}", rentId);
                throw;
            }

            var updatedRentWithIncludes = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rent.Id,
                includeProperties: new[] { "Car", "Renter", "Receipt" })).FirstOrDefault();
            return _mapper.Map<RentGetDto>(updatedRentWithIncludes);
        }

        private async Task SendSatisfactionSurvey(Rent rent)
        {
            if (rent.Renter == null)
            {
                _logger.LogWarning("Cannot send satisfaction survey for Rent ID {RentId}: Renter data missing.",
                    rent.Id);
                return;
            }

            if (string.IsNullOrWhiteSpace(rent.Renter.Email))
            {
                _logger.LogWarning("Cannot send satisfaction survey for Rent ID {RentId}: Renter email missing.",
                    rent.Id);
                return;
            }

            var toEmail = rent.Renter.Email;
            var subject = "Véleménye fontos számunkra! Autóbérlés visszajelzés";

            var body = $@"
            <html>
                <body>
                    <p>Kedves {rent.Renter.Name},</p>
                    <p>Köszönjük, hogy minket választott! A bérelt járművet sikeresen visszavettük. (Szerződés azonosító: <strong>#{rent.Id}</strong>)</p>
                    <p>Ahhoz, hogy szolgáltatásunkat még jobban tudjuk fejleszteni, kérjük, szánjon 1 percet az alábbi rövid elégedettségi kérdőív kitöltésére:</p>
                    <p style='margin: 20px 0;'>
                        <a href='{_satisfactionSurveyUrl}' style='padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'>
                            Kérdőív kitöltése
                        </a>
                    </p>
                    <p>Az Ön visszajelzése rendkívül értékes számunkra!</p>
                    <p>Üdvözlettel,<br>{_mailSettings.FromName} csapata</p>
                </body>
            </html>";

            try
            {
                await _emailService.SendEmailAsync(toEmail, subject, body);
                _logger.LogInformation("Satisfaction survey email sent for Rent ID {RentId} to {Email}.", rent.Id,
                    toEmail);
            }
            catch (Exception ex)
            {
                // Log the failure, but don't re-throw, as failing to send a survey shouldn't halt the main process.
                _logger.LogError(ex, "Failed to send satisfaction survey email for Rent ID {RentId}.", rent.Id);
            }
        }
    }
}