using Database.Data;
using Database.Models;
using Database.Dtos;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace Services.Services
{
    public interface ICarServices
    {
        public bool IsCarAvailable(int carId);
        Task<CarDto> AddCarAsync(CreateCarDto carDto); 
        Task<CarDto> RemoveCarAsync(int carId);
        Task<List<CarDto>> ListCarsAsync();
        Task<List<Car>> GetAvailableCarsAsync();
        Task<CarDto> UpdateCarAsync(int id, UpdateCarDto carUpdateDto);
        Task<bool> ValidateVignetteAsync(int carId);
    }

    public class CarService : ICarServices
    {
        private readonly BerautoDbContext _context;
        private readonly ILogger<CarService> _logger;
        private readonly IMapper _mapper;
        public CarService(BerautoDbContext context, ILogger<CarService> logger, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public bool IsCarAvailable(int carId)
        {
            var car = _context.Cars.Find(carId);
            if (car == null)
            {
                throw new ArgumentException($"Car with ID {carId} not found.");
            }
            return car.IsAvailable;
        }

        public async Task<CarDto> AddCarAsync(CreateCarDto createCarDto)
        {
            var car = _mapper.Map<Car>(createCarDto);

            _logger.LogInformation("Adding a new car");

            await _context.Cars.AddAsync(car);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Car added successfully with ID: {CarId}", car.Id);
            return _mapper.Map<CarDto>(car);
        }

        public async Task<CarDto> RemoveCarAsync(int id)
        {
            var car = await _context.Cars.FindAsync(id);
            if (car == null)
            {
                throw new ArgumentException($"Car with ID {id} not found.");
            }

            _logger.LogInformation($"Removing car with ID: {id}");

            _context.Cars.Remove(car);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Car with ID: {id} removed successfully");
            return _mapper.Map<CarDto>(car);
        }

        public async Task<List<CarDto>> ListCarsAsync()
        {

            _logger.LogInformation("Listing all cars");
            var cars = await _context.Cars.ToListAsync();
            return _mapper.Map<List<CarDto>>(cars);
        }
        public async Task<List<Car>> GetAvailableCarsAsync()
        {
            _logger.LogInformation("GetAvailableCars method called");
            return await _context.Cars.Where(car => car.IsAvailable).ToListAsync();

        }
        public async Task<CarDto> UpdateCarAsync(int id, UpdateCarDto carUpdateDto)
        {
            var car = await _context.Cars.FindAsync(id);
            if (car == null)
            {
                throw new ArgumentException($"Car with ID {id} not found.");
            }

            _logger.LogInformation($"Updating 'IsAvailable' status for car with ID: {id}");

            car.IsAvailable = (bool)carUpdateDto.IsAvailable;

            _context.Cars.Update(car);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Car with ID: {id} 'IsAvailable' updated successfully");
            return _mapper.Map<CarDto>(car);
        }

        public async Task<bool> ValidateVignetteAsync(int carId)
        {
            var car = await _context.Cars.FindAsync(carId);
            if (car == null)
            {
                throw new ArgumentException($"Car with ID {carId} not found.");
            }

            _logger.LogInformation("Validating vignette for car with ID: {CarId}", car.Id);
            return car.HaveValidVignette;
        }
    }
}