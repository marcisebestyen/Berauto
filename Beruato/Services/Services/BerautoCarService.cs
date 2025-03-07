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
        public Task AddCarAsync(CarDto carDto); 
        public Task RemoveCarAsync(int carId);
        public Task<List<Car>> ListCarsAsync();
        public Task<List<Car>> GetAvailableCarsAsync();
        public Task UpdateCarAsync(int id, CarUpdateDTO carUpdateDto);
    }

    public class BerautoCarService : ICarServices
    {
        private readonly BerautoDbContext _context;
        private readonly ILogger<BerautoCarService> _logger;
        private readonly IMapper _mapper;
        public BerautoCarService(BerautoDbContext context, ILogger<BerautoCarService> logger, IMapper mapper)
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

        public async Task AddCarAsync(CarDto carDto)
        {
            var car = _mapper.Map<Car>(carDto);

            _logger.LogInformation("Adding a new car");

            await _context.Cars.AddAsync(car);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Car added successfully with ID: {CarId}", car.Id);
        }

        public async Task RemoveCarAsync(int id)
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
        }

        public async Task<List<Car>> ListCarsAsync()
        {

            _logger.LogInformation("Listing all cars");
            return await _context.Cars.ToListAsync();
        }
        public async Task<List<Car>> GetAvailableCarsAsync()
        {
            _logger.LogInformation("GetAvailableCars method called");
            return await _context.Cars.Where(car => car.IsAvailable).ToListAsync();

        }
        public async Task UpdateCarAsync(int id, CarUpdateDTO carUpdateDto)
        {
            var car = await _context.Cars.FindAsync(id);
            if (car == null)
            {
                throw new ArgumentException($"Car with ID {id} not found.");
            }

            // Map non-null properties from carUpdateDto to the existing car entity
            _mapper.Map(carUpdateDto, car);

            _logger.LogInformation($"Updating car with ID: {id}");

            _context.Cars.Update(car);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Car with ID: {id} updated successfully");
        }
    }
}