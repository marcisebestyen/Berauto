﻿using System.ComponentModel.DataAnnotations;
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

        var existingCar =
            await _unitOfWork.CarRepository.GetByIdAsync(new object[]
            {
                id
            }); 
        if (existingCar == null)
        {
            // _logger.LogInformation("UpdateCarAsync: Car with ID {CarId} not found.", id);
            throw new KeyNotFoundException($"A {id} azonosítójú autó nem található.");
        }

        patchDocument.ApplyTo(existingCar, modelState);

        if (!modelState.IsValid)
        {
            throw new ArgumentException("A JSON Patch dokumentum műveletei hibát eredményeztek. Lásd a részleteket.",
                nameof(patchDocument));
        }

        var validationContext = new ValidationContext(existingCar, serviceProvider: null, items: null);
        var validationResults = new List<ValidationResult>();
        bool isEntityValid = Validator.TryValidateObject(existingCar, validationContext, validationResults,
            validateAllProperties: true);

        if (!isEntityValid)
        {
            foreach (var validationResult in validationResults)
            {
                if (validationResult.MemberNames.Any())
                {
                    foreach (var memberName in validationResult.MemberNames)
                    {
                        modelState.AddModelError(memberName, validationResult.ErrorMessage);
                    }
                }
                else
                {
                    modelState.AddModelError(string.Empty, validationResult.ErrorMessage); 
                }
            }

            // _logger.LogWarning("UpdateCarAsync: Entity validation failed after patch for car ID {CarId}. ModelState: {@ModelState}", id, modelState);
            throw new ArgumentException(
                "Az entitás validációja sikertelen a patch alkalmazása után. Lásd a részleteket.", nameof(existingCar));
        }

        await _unitOfWork.SaveAsync();

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