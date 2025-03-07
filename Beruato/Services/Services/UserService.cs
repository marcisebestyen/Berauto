using AutoMapper;
using Database.Data;
using Database.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Database.Models
{
    public interface IUserService
    {
        Task<UserDto> AddUser(CreateUserDto userDto);
        Task<string> GetAddress(int userId);
        Task<string> GetEmail(int userId);

        Task<List<string>> GetPhoneNumber(int userId);
    }

    public class UserService : IUserService
    {
        private readonly BerautoDbContext _context;
        private readonly IMapper _mapper;

        public UserService(BerautoDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<UserDto> AddUser(CreateUserDto userDto)
        {
            var user = _mapper.Map<User>(userDto);
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return _mapper.Map<UserDto>(user);
        }

        public async Task<string> GetAddress(int userId)
        {
            var user = await _context.Users
                .Include(a => a.Address)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || user.Address == null)
            {
                throw new ArgumentException("The given user does not exist or has no address.");
            }

            var address = user.Address;
            string formattedAddress = $"{address.ZipCode} {address.Settlement} {address.Street} Street {address.HouseNumber}";

            if (!string.IsNullOrEmpty(address.Floor))
            {
                formattedAddress += $", {address.Floor}. level";
            }
            if (!string.IsNullOrEmpty(address.Door))
            {
                formattedAddress += $", {address.Door}. door";
            }

            return formattedAddress;
        }

        public async Task<string> GetEmail(int userId)
        {
            var email = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Email)
                .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(email))
            {
                throw new ArgumentException("The given user does not exist or has no email address.");
            }

            return email;
        }

        public async Task<List<string>> GetPhoneNumber(int userId)
        {
            var phoneNumbers = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => u.PhoneNumber)
                .FirstOrDefaultAsync();

            if (phoneNumbers!.Any() || phoneNumbers == null)
            {
                throw new ArgumentException("The given user does not exist or has no phone number");
            }

            return phoneNumbers;
        }
    }
}
