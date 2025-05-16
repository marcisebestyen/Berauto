using Database.Models;
using Services.Repositories;
using Database.Dtos.CarDtos;
using AutoMapper;

namespace Services.Services;
public interface ICarService
{
    Task<IEnumerable<CarGetDto>> GetAllCarsAsync();
    Task<CarGetDto?> GetCarByIdAsync(int id);
    Task<CarGetDto> AddCarAsync(CarCreateDto createCarDto);
    Task UpdateCarAsync(int id, CarUpdateDto updateCarDto);
    Task DeleteCarAsync(int id);
    Task UpdateCarKilometersAsync(int id, decimal newKilometers);
    Task<IEnumerable<CarGetDto>> GetAvailableCarsAsync(DateTime startDate, DateTime endDate);
    Task SetCarConditionAsync(int id, bool inProperCondition);
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
    public async Task UpdateCarAsync(int id, CarUpdateDto updateCarDto)
    {
        var existingCar = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { id });
        if (existingCar != null)
        {
            _mapper.Map(updateCarDto, existingCar);

            await _unitOfWork.CarRepository.UpdateAsync(existingCar);
            await _unitOfWork.SaveAsync();
        }
        else
        {
            throw new KeyNotFoundException($"Car with id {id} not found.");
        }
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

    public async Task UpdateCarKilometersAsync(int id, decimal newKilometers)
    {
        var car = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { id });
        if (car != null)
        {
            car.ActualKilometers = newKilometers;
            await _unitOfWork.CarRepository.UpdateAsync(car);
            await _unitOfWork.SaveAsync();
        }
        else
        {
            throw new KeyNotFoundException($"Car with id {id} not found.");
        }
    }

    public async Task<IEnumerable<CarGetDto>> GetAvailableCarsAsync(DateTime startDate, DateTime endDate)
    {
        var rentedCarIds = (await _unitOfWork.RentRepository.GetAsync(
            rent => rent.PlannedStart < endDate && rent.PlannedEnd > startDate
        ))
        .Select(rent => rent.CarId)
        .Distinct()
        .ToList();

        var availableCarsEntities = await _unitOfWork.CarRepository.GetAsync(
            car => car.InProperCondition && !rentedCarIds.Contains(car.Id)
        );

        return _mapper.Map<IEnumerable<CarGetDto>>(availableCarsEntities);
    }

    public async Task SetCarConditionAsync(int id, bool inProperCondition)
    {
        var car = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { id });
        if (car != null)
        {
            car.InProperCondition = inProperCondition;
            await _unitOfWork.CarRepository.UpdateAsync(car);
            await _unitOfWork.SaveAsync();
        }
        else
        {
            throw new KeyNotFoundException($"Car with id {id} not found.");
        }
    }
}