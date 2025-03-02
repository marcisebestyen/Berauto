using Database.Data;
using Database.Models;

namespace Services.Services
{
   
    public interface IBerautoService
    {
        List<Car> List();
    }
        

    public class BeratuoService : IBerautoService
    {
        private readonly BerautoDbContext _context;

        public BeratuoService(BerautoDbContext context)
        {
            _context = context;
        }

        public List<Car> List()
        {
            var car1 = new Car
            {
                Id = 1,
                IsAvailable = true,
                Licence = RequiredLicence.B,
                Brand = "Tesla",
                Model = "Model S",
                LicencePlate = "ABC123",
                HaveValidVignette = true,
                Price = 60000,
                Seats = 5,
                FuelType = FuelType.Electric,
                IsAutomaticTransmission = true,
                Trunk = 25.3
            };
            var car2 = new Car
            {
                Id = 2,
                IsAvailable = false,
                Licence = RequiredLicence.B,
                Brand = "BMW",
                Model = "X5",
                LicencePlate = "XYZ789",
                HaveValidVignette = false,
                Price = 75000,
                Seats = 7,
                FuelType = FuelType.Petrol,
                IsAutomaticTransmission = true,
                Trunk = 20.5
            };
            var car3 = new Car
            {
                Id = 3,
                IsAvailable = true,
                Licence = RequiredLicence.B,
                Brand = "Audi",
                Model = "A4",
                LicencePlate = "DEF456",
                HaveValidVignette = true,
                Price = 40000,
                Seats = 5,
                FuelType = FuelType.Diesel,
                IsAutomaticTransmission = false,
                Trunk = 17.8
            };

            return new List<Car> { car1, car2, car3 };
        }
    }
    
}
