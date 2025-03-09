using AutoMapper;
using Database.Data;
using Database.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Database.Models
{
    public interface IUserService
    {
        Task<UserDto> AddUser(CreateUserDto userDto);
        Task<UserDto> GetUser(int userId);
        Task<List<UserDto>> GetUsers();
        Task<UserDto> UpdateUser(int userId, UpdateUserDto updateUserDto);
        Task<bool> DeleteUser(int userId);
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

        public async Task<UserDto> GetUser(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Address)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new ArgumentException("The given user does not exist.");
            }

            return _mapper.Map<UserDto>(user);
        }

        public async Task<List<UserDto>> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.Address)
                .ToListAsync();

            return _mapper.Map<List<UserDto>>(users);
        }

        public async Task<UserDto> UpdateUser(int userId, UpdateUserDto updateUserDto)
        {
            try
            {
                var user = await _context.Users
                .Include(u => u.Address)
                .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    throw new ArgumentException("User not found");
                }

                _mapper.Map(updateUserDto, user);

                await _context.Entry(user)
                    .Reference(u => u.Address)
                    .LoadAsync();


                await _context.SaveChangesAsync();
                return _mapper.Map<UserDto>(user);
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine("DB Update Error: " + ex.InnerException?.Message);
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine("General Error: " + ex.Message);
                throw;
            }
        }

        public async Task<bool> DeleteUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return false;
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
