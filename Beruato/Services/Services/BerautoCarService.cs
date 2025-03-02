using Database.Data;
using Database.Models;
using Microsoft.Extensions.Logging;

namespace Services.Services
{
    public interface ICarServices
    {
        public bool IsCarAvailable(int carId);
        public void AddCar(RequiredLicence licence,string brand, string model,
        string licencePlate, bool haveValidVignette, decimal price, 
        int seats, FuelType fuelType, bool isAutomaticTransmission, double trunk); // Added method signature
        public void RemoveCar(int carId);
        public void ListCars();
        public IEnumerable<Car> GetAvailableCars();
        public void UpdateCar(int id, bool? isAvailable, RequiredLicence? licence, string brand, string model,
        string licencePlate, bool? haveValidVignette, decimal? price,
        int? seats, FuelType? fuelType, bool? isAutomaticTransmission, double? trunk);
    }

    public class BerautoCarService : ICarServices
    {
        private readonly BerautoDbContext _context;
        private readonly ILogger<BerautoCarService> _logger;

        public BerautoCarService(BerautoDbContext context, ILogger<BerautoCarService> logger)
        {
            _context = context;
            _logger = logger;
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

        public void AddCar(RequiredLicence licence,string brand, string model,
        string licencePlate, bool haveValidVignette, decimal price,
        int seats, FuelType fuelType, bool isAutomaticTransmission, double trunk)
        {
            var car = new Car
            {
                Licence = licence,
                Brand = brand,
                Model = model,
                LicencePlate = licencePlate,
                Price = price,
                Seats = seats,
                FuelType = fuelType,
                IsAutomaticTransmission = isAutomaticTransmission,
                Trunk = trunk
            };

            _logger.LogInformation("Adding a new car with ID: {CarId}", car.Id);

            _context.Cars.Add(car);
            _context.SaveChanges();

            _logger.LogInformation($"Car with ID: {car.Id} added successfully");
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
        public void UpdateCar(int id, bool? isAvailable, RequiredLicence? licence, string brand, string model,
        string licencePlate, bool? haveValidVignette, decimal? price, 
        int? seats, FuelType? fuelType, bool? isAutomaticTransmission, double? trunk)
        {
            var car = _context.Cars.Find(id);
            if (car == null)
            {
                throw new ArgumentException($"Car with ID {id} not found.");
            }

            if (isAvailable.HasValue) car.IsAvailable = isAvailable.Value;
            if (licence.HasValue) car.Licence = licence.Value;
            if (!string.IsNullOrEmpty(brand)) car.Brand = brand;
            if (!string.IsNullOrEmpty(model)) car.Model = model;
            if (!string.IsNullOrEmpty(licencePlate)) car.LicencePlate = licencePlate;
            if (haveValidVignette.HasValue) car.HaveValidVignette = haveValidVignette.Value;
            if (price.HasValue) car.Price = price.Value;
            if (seats.HasValue) car.Seats = seats.Value;
            if (fuelType.HasValue) car.FuelType = fuelType.Value;
            if (isAutomaticTransmission.HasValue) car.IsAutomaticTransmission = isAutomaticTransmission.Value;
            if (trunk.HasValue) car.Trunk = trunk.Value;

            _logger.LogInformation("Updating car with ID: {CarId}", car.Id);

            _context.Cars.Update(car);
            _context.SaveChanges();

            _logger.LogInformation("Car with ID: {CarId} updated successfully", car.Id);
        }
    }
}