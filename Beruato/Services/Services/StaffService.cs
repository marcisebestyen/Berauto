﻿using AutoMapper;
using Database.Dtos.RentDtos;
using Services.Repositories;
using Microsoft.Extensions.Logging;
using Database.Results;
using Database.Dtos.ReceiptDtos;
using Database.Models;

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

        public StaffService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<StaffService> logger,
            IReceiptService receiptService,
            IRentService rentService)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _receiptService = receiptService ?? throw new ArgumentNullException(nameof(receiptService));

        }

        public async Task<RentGetDto> ApprovedBy(int staffId, int rentId)
        {
            var staffUser = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
            if (staffUser == null || (staffUser.Role != Role.Staff && staffUser.Role != Role.Admin))
            {
                _logger.LogWarning("Approve failed: User {StaffId} not found or not authorized.", staffId);
                throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff/admin.");
            }

            var rent = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rentId, includeProperties: new[] { "Car", "Renter" })).FirstOrDefault();

            if (rent == null)
            {
                _logger.LogWarning("Approve failed: Rent with ID {RentId} not found.", rentId);
                throw new KeyNotFoundException($"Rent with id {rentId} not found.");
            }

            if (rent.ApprovedBy.HasValue)
            {
                _logger.LogInformation("Rent ID {RentId} was already approved by Staff ID {ApproverId}.", rentId, rent.ApprovedBy.Value);
                var alreadyApprovedRent = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rent.Id, includeProperties: new[] { "Car", "Renter", "Receipt" })).FirstOrDefault();
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

            _logger.LogInformation("Rent ID {RentId} approved by Staff ID {StaffId}. All changes saved.", rentId, staffId);

            var updatedRentWithIncludes = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rent.Id, includeProperties: new[] { "Car", "Renter", "Receipt" })).FirstOrDefault();
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
                _logger.LogWarning("Reject failed: Rent ID {RentId} has already started and cannot be rejected by deletion.", rentId);
                return ServiceResult.Failed("Ez a bérlés már elkezdődött, nem törölhető elutasítással.");
            }
            if (rent.ApprovedBy.HasValue)
            {
                _logger.LogWarning("Reject failed: Rent ID {RentId} has already been approved. Rejection by deletion is not allowed.", rentId);
                return ServiceResult.Failed("Ez a bérlés már jóvá lett hagyva. A törléséhez/elutasításához más eljárás lehet szükséges.");
            }

            try
            {
                await _unitOfWork.RentRepository.DeleteAsync(rent.Id);
                await _unitOfWork.SaveAsync();
                _logger.LogInformation("Rent ID {RentId} rejected (deleted) by Staff ID {StaffId}. Reason (logged, not stored): {Reason}", rentId, staffId, reason ?? "N/A");
                return ServiceResult.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting Rent ID {RentId} during rejection by Staff ID {StaffId}.", rentId, staffId);
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

            var rent = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rentId, includeProperties: new[] { "Car" })).FirstOrDefault();
            if (rent == null) { throw new KeyNotFoundException($"Rent with id {rentId} not found."); }
            if (rent.Car == null) { throw new InvalidOperationException($"Car data not loaded for Rent with id {rentId}."); }
            if (!rent.ApprovedBy.HasValue) { throw new InvalidOperationException($"Rent with id {rentId} has not been approved yet and cannot be issued."); }
            if (rent.ActualStart.HasValue) { throw new InvalidOperationException($"Rent with id {rentId} has already been issued on {rent.ActualStart.Value}."); }

            rent.StartingKilometer = rent.Car.ActualKilometers;
            rent.IssuedBy = staffId;
            rent.ActualStart = actualStart;

            try
            {
                await _unitOfWork.RentRepository.UpdateAsync(rent);
                await _unitOfWork.SaveAsync();
            }
            catch (Exception ex) { _logger.LogError(ex, "Error during issuing car for Rent ID {RentId}", rentId); throw; }
            var updatedRentWithIncludes = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rent.Id, includeProperties: new[] { "Car", "Renter", "Receipt" })).FirstOrDefault();
            return _mapper.Map<RentGetDto>(updatedRentWithIncludes);
        }

        public async Task<RentGetDto> TakenBackBy(int staffId, int rentId, DateTime actualEnd, decimal endingKilometer)
        {
            var staffUser = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
            if (staffUser == null || (staffUser.Role != Role.Staff && staffUser.Role != Role.Admin))
            {
                throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff/admin.");
            }

            var rent = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rentId, includeProperties: new[] { "Car", "Renter" })).FirstOrDefault();
            if (rent == null) { throw new KeyNotFoundException($"Rent with id {rentId} not found."); }
            if (rent.Car == null) { throw new InvalidOperationException($"Car data not loaded for Rent with id {rentId}."); }
            if (!rent.ActualStart.HasValue) { throw new InvalidOperationException($"Rent with id {rentId} cannot be taken back as it was not issued yet."); }
            if (rent.ActualEnd.HasValue) { throw new InvalidOperationException($"Rent with id {rentId} has already been taken back on {rent.ActualEnd.Value}."); }
            if (!rent.StartingKilometer.HasValue) { throw new InvalidOperationException($"StartingKilometer is missing for Rent ID {rentId}. Cannot calculate cost."); }
            else if (endingKilometer < rent.StartingKilometer.Value) { throw new InvalidOperationException($"Ending kilometer ({endingKilometer}) cannot be less than starting kilometer ({rent.StartingKilometer.Value})."); }

            rent.TakenBackBy = staffId;
            rent.ActualEnd = actualEnd;
            rent.EndingKilometer = endingKilometer;

            decimal? calculatedCost = null;
            if (rent.Car.PricePerDay > 0 && rent.StartingKilometer.HasValue)
            {
                decimal drivenKilometers = Math.Max(0, endingKilometer - rent.StartingKilometer.Value);
                calculatedCost = drivenKilometers * rent.Car.PricePerDay;
                rent.TotalCost = calculatedCost;
            }
            else
            {
                _logger.LogWarning("Could not calculate TotalCost for Rent ID {RentId} due to missing PricePerDay on Car or StartingKilometer on Rent.", rentId);
            }

            rent.Car.ActualKilometers = endingKilometer;

            if (rent.ReceiptId.HasValue && calculatedCost.HasValue)
            {
                var receipt = await _unitOfWork.ReceiptRepository.GetByIdAsync(new object[] { rent.ReceiptId.Value });
                if (receipt != null)
                {
                    receipt.TotalCost = calculatedCost.Value;
                    await _unitOfWork.ReceiptRepository.UpdateAsync(receipt);
                    _logger.LogInformation("Receipt ID {ReceiptId} updated with final TotalCost {TotalCost} for Rent ID {RentId}.", receipt.Id, calculatedCost.Value, rentId);
                }
                else
                {
                    _logger.LogWarning("Receipt with ID {ReceiptId} not found for Rent ID {RentId} during TakeBack. Cannot update receipt total cost.", rent.ReceiptId.Value, rentId);
                }
            }


            try
            {
                await _unitOfWork.RentRepository.UpdateAsync(rent);
                await _unitOfWork.CarRepository.UpdateAsync(rent.Car);
                await _unitOfWork.SaveAsync();
            }
            catch (Exception ex) { _logger.LogError(ex, "Error during taking back car for Rent ID {RentId}", rentId); throw; }
            var updatedRentWithIncludes = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rent.Id, includeProperties: new[] { "Car", "Renter", "Receipt" })).FirstOrDefault();
            return _mapper.Map<RentGetDto>(updatedRentWithIncludes);
        }
    }
}