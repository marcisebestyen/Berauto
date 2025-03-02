using Database.Data;
using Database.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services
{
    public interface IBerautoRentServise
    {
        public void AddRent(int carId, int userId,int administratorId, DateTime startDateDate, DateTime endDate);
        public void ReturnRent(int rentId);
        public List<Rent> GetRents();
    }

    public class BerautoRentService : IBerautoRentServise
    {
        private readonly BerautoDbContext _context;

        public BerautoRentService(BerautoDbContext context)
        {
            _context = context;
        }

        public void AddRent(int carId, int userId, int administratorId, DateTime startDate, DateTime endDate)
        {
            var car = _context.Cars.FirstOrDefault(c => c.Id == carId);
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            var administrator = _context.Users.FirstOrDefault(u => u.Id == administratorId);
            if (car == null || user == null || administrator == null)
            {
                throw new Exception("Car or user or administrator not found");
            }
            if (!car.IsAvailable)
            {
                throw new Exception("Car is not available");
            }
            var rent = new Rent
            {
                Car = car,
                User = user,
                Administrator = administrator,
                StartDate = startDate,
                EndDate = endDate
            };
            
            _context.Rents.Add(rent);
            _context.SaveChanges();
        }

        public void ReturnRent(int rentId)
        {
            var rent = _context.Rents.FirstOrDefault(r => r.Id == rentId);
            if (rent == null)
            {
                throw new Exception("Rent not found");
            }
            rent.Finished = true;
            _context.SaveChanges();
        }

        public List<Rent> GetRents()
        {
            return _context.Rents.ToList();
        }



    }
}
