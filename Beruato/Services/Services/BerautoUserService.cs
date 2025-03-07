using Database.Data;
using Microsoft.EntityFrameworkCore;
using Database.Dtos;

namespace Database.Models
{
    public interface IUserService
    {
        void AddUser(UserDto userDto);
        string GetFullName(int userId);
        string GetEmail(int userId);
        List<string> GetPhoneNumber(int userId);
        string GetAddress(int userId);
    }

    public class BerautoUserService : IUserService
    {
        private readonly BerautoDbContext _context;

        public BerautoUserService(BerautoDbContext context)
        {
            _context = context;
        }

        public void AddUser(UserDto userDto)
        {
            var newUser = new User
            {
                UserName = userDto.UserName,
                FirstName = userDto.FirstName,
                LastName = userDto.LastName,
                Email = userDto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password),
                AddressId = userDto.AddressId,
                Role = userDto.Role,
                PhoneNumber = userDto.PhoneNumber
            };

            _context.Users.Add(newUser);
            _context.SaveChanges();
        }

        public string GetAddress(int userId)
        {
            var user = _context.Users
                .Include(a => a.Address)
                .FirstOrDefault(u => u.Id == userId);

            if (user == null || user.Address == null)
            {
                throw new ArgumentException("Az adott felhasználó nem létezik vagy nincs lakcíme.");
            }

            var address = user.Address;
            string formattedAddress = $"{address.ZipCode} {address.Settlement} {address.Street} utca {address.HouseNumber}";

            if (!string.IsNullOrEmpty(address.Floor))
            {
                formattedAddress += $", {address.Floor}. emelet";
            }
            if (!string.IsNullOrEmpty(address.Door))
            {
                formattedAddress += $", {address.Door}.  ajtó";
            }

            return formattedAddress;
        }

        public string GetEmail(int userId)
        {
            var email = _context.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Email)
                .FirstOrDefault();

            if (string.IsNullOrEmpty(email))
            {
                throw new ArgumentException("Az adott felhasználó nem létezik vagy nincs emailje.");
            }

            return email;
        }

        public string GetFullName(int userId)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                throw new ArgumentException("Az adott felhasználó nem létezik vagy.");
            }

            return $"{user.FirstName} {user.LastName}";
        }

        public List<string> GetPhoneNumber(int userId)
        {
            var phoneNumbers = _context.Users
                .Where(u => u.Id == userId)
                .Select(u => u.PhoneNumber)
                .FirstOrDefault();

            if (phoneNumbers!.Any() || phoneNumbers == null)
            {
                throw new ArgumentException("Az adott felhasználó nem létezik vagy nincs telefonszáma.");
            }

            return phoneNumbers;
        }

        
    }
}
