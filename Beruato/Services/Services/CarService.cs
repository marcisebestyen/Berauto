using System.ComponentModel.DataAnnotations;
using Database.Models;
using Services.Repositories;
using Database.Dtos.CarDtos;
using AutoMapper;
using Database.Results;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc;

namespace Services.Services;

public interface ICarService
{
    Task<IEnumerable<CarGetDto>> GetAllCarsAsync();
    Task<CarGetDto?> GetCarByIdAsync(int id);
    Task<CarGetDto> AddCarAsync(CarCreateDto createCarDto);
    Task<ServiceResult> UpdateCarAsync(int id, JsonPatchDocument<Car> patchDocument, ModelStateDictionary modelState);
    Task DeleteCarAsync(int id);
    Task<IEnumerable<CarGetDto>> GetAvailableCarsAsync(DateTime startDate, DateTime endDate);
}

public class CarService : ICarService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CarService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    public async Task<IEnumerable<CarGetDto>> GetAllCarsAsync()
    {
        var cars = await _unitOfWork.CarRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<CarGetDto>>(cars);
    }

    public async Task<CarGetDto?> GetCarByIdAsync(int id)
    {
        var car = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { id });
        if (car == null)
        {
            return null;
        }

        return _mapper.Map<CarGetDto>(car);
    }

    public async Task<CarGetDto> AddCarAsync(CarCreateDto createCarDto)
    {
        var car = _mapper.Map<Car>(createCarDto);

        await _unitOfWork.CarRepository.InsertAsync(car);
        await _unitOfWork.SaveAsync();

        return _mapper.Map<CarGetDto>(car);
    }

    public async Task<ServiceResult> UpdateCarAsync(int id, JsonPatchDocument<Car> patchDocument,
        ModelStateDictionary modelState)
    {
        // A patchDocument null ellenőrzése már a controllerben megtörtént, de itt is lehetne.
        // A C# 8+ nullable reference types segíthet ennek kikényszerítésében.

        var existingCar =
            await _unitOfWork.CarRepository.GetByIdAsync(new object[]
            {
                id
            }); // Feltételezve, hogy a GetByIdAsync object[] helyett int-et is elfogad, vagy van egy ilyen overload.
        // Vagy: await _unitOfWork.CarRepository.GetByIdAsync(new object[] { id });
        if (existingCar == null)
        {
            // _logger.LogInformation("UpdateCarAsync: Car with ID {CarId} not found.", id);
            throw new KeyNotFoundException($"A {id} azonosítójú autó nem található.");
        }

        // 1. Alkalmazzuk a patch műveleteket a meglévő entitásra.
        // Az ApplyTo metódus a 'modelState'-be írja a patch alkalmazása során felmerülő hibákat
        // (pl. érvénytelen elérési út, "test" művelet sikertelensége).
        patchDocument.ApplyTo(existingCar, modelState);

        // 2. Ellenőrizzük, hogy maga a patch alkalmazása adott-e hibát a ModelState-hez.
        if (!modelState.IsValid)
        {
            // _logger.LogWarning("UpdateCarAsync: Errors after applying patch to car ID {CarId}. ModelState: {@ModelState}", id, modelState);
            // A controller ezt elkapja és BadRequest(ModelState) választ ad.
            throw new ArgumentException("A JSON Patch dokumentum műveletei hibát eredményeztek. Lásd a részleteket.",
                nameof(patchDocument));
        }

        // 3. ERŐSEN AJÁNLOTT: Az EGÉSZ entitás validálása DataAnnotations alapján a patch alkalmazása UTÁN.
        // A JsonPatchDocument.ApplyTo önmagában nem futtatja ezeket a validációkat az entitás teljes állapotára.
        var validationContext = new ValidationContext(existingCar, serviceProvider: null, items: null);
        var validationResults = new List<ValidationResult>();
        bool isEntityValid = Validator.TryValidateObject(existingCar, validationContext, validationResults,
            validateAllProperties: true);

        if (!isEntityValid)
        {
            foreach (var validationResult in validationResults)
            {
                // A MemberNames tartalmazhatja a hibás property nevét, vagy üres lehet általánosabb hibáknál.
                if (validationResult.MemberNames.Any())
                {
                    foreach (var memberName in validationResult.MemberNames)
                    {
                        modelState.AddModelError(memberName, validationResult.ErrorMessage);
                    }
                }
                else
                {
                    modelState.AddModelError(string.Empty, validationResult.ErrorMessage); // Entitás szintű hiba
                }
            }

            // _logger.LogWarning("UpdateCarAsync: Entity validation failed after patch for car ID {CarId}. ModelState: {@ModelState}", id, modelState);
            throw new ArgumentException(
                "Az entitás validációja sikertelen a patch alkalmazása után. Lásd a részleteket.", nameof(existingCar));
        }

        // 4. Itt jöhetnek egyedi üzleti szabályok ellenőrzései, amelyek InvalidOperationException-t dobhatnak.
        // Pl.: await ValidateBusinessRulesAsync(existingCar);

        // 5. Változások mentése az adatbázisba
        // Az EF Core változáskövetése észleli a 'existingCar' entitáson történt módosításokat.
        // A repository UpdateAsync metódusa beállíthatja az entitás állapotát 'Modified'-re,
        // bár ha az entitás már követett, az EF Core automatikusan észleli a változásokat.
        // _unitOfWork.CarRepository.Update(existingCar); // Vagy csak hagyjuk, hogy az EF Core kövesse
        await _unitOfWork.SaveAsync();

        // _logger.LogInformation("UpdateCarAsync: Successfully updated and saved car ID {CarId}.", id);
        return ServiceResult.Success("Autó sikeresen updatelve.");
    }

    public async Task DeleteCarAsync(int id)
    {
        try
        {
            await _unitOfWork.CarRepository.DeleteAsync(id);
            await _unitOfWork.SaveAsync();
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
    }


    public async Task<IEnumerable<CarGetDto>> GetAvailableCarsAsync(DateTime startDate, DateTime endDate)
    {
        var rentedCarIds =
            (await _unitOfWork.RentRepository.GetAsync(rent =>
                rent.PlannedStart < endDate && rent.PlannedEnd > startDate
            ))
            .Select(rent => rent.CarId)
            .Distinct()
            .ToList();

        var availableCarsEntities =
            await _unitOfWork.CarRepository.GetAsync(car => car.InProperCondition && !rentedCarIds.Contains(car.Id)
            );

        return _mapper.Map<IEnumerable<CarGetDto>>(availableCarsEntities);
    }
}