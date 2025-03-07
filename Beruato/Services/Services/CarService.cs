using Database.Data;
using Database.Models;
using Database.Dtos;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace Services.Services
{
    public interface ICarServices
    {
        public bool IsCarAvailable(int carId);
        public void AddCar(CarDto carDto); 
        public void RemoveCar(int carId);
        public void ListCars();
        public IEnumerable<Car> GetAvailableCars();
        public void UpdateCar(int id, UpdateCarDto carUpdateDto);
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

        public void AddCar(CarDto carDto)
        {
            var car = _mapper.Map<Car>(carDto);

            _logger.LogInformation("Adding a new car");

            _context.Cars.Add(car);
            _context.SaveChanges();

            _logger.LogInformation("Car added successfully with ID: {CarId}", car.Id);
        }

        public void RemoveCar(int carId)
        {
            var car = _context.Cars.Find(carId);
            if (car == null)
            {
                throw new ArgumentException($"Car with ID {carId} not found.");
            }

            _context.Cars.Remove(car);
            _context.SaveChanges();
        }

        public void ListCars()
        {
            var cars = _context.Cars.ToList();
            if (cars == null || !cars.Any())
            {
                Console.WriteLine("No cars available.");
                return;
            }

            foreach (var car in cars)
            {
                Console.WriteLine($"ID: {car.Id}, Brand: {car.Brand}, Model: {car.Model}, Price: {car.Price}");
            }
        }
        public IEnumerable<Car> GetAvailableCars()
        {
            _logger.LogInformation("GetAvailableCars method called");
            return _context.Cars.Where(car => car.IsAvailable).ToList();

        }
        public void UpdateCar(int id, UpdateCarDto carUpdateDto)
        {
            var car = _context.Cars.Find(id);
            if (car == null)
            {
                throw new ArgumentException($"Car with ID {id} not found.");
            }

            // Map non-null properties from carUpdateDto to the existing car entity
            _mapper.Map(carUpdateDto, car);

            _logger.LogInformation($"Updating car with ID: {id}");

            _context.Cars.Update(car);
            _context.SaveChanges();

            _logger.LogInformation($"Car with ID: {id} updated successfully");
        }
    }
}