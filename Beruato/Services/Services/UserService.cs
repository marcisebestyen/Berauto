using AutoMapper;
using Database.Data;
using Database.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Database.Models
{
    public interface IUserService
    {
        Task<UserDto> AddUser(CreateUserDto userDto);
        Task<UserDto> GetUser(int userId);
        Task<List<UserDto>> GetUsers();
        Task<UserDto> UpdateUser(int userId, UpdateUserDto updateUserDto);
        Task<bool> DeleteUser(int userId);
        Task<string> LoginAsync(UserLoginDto userDto);
        Task<int> GetUserRents(int userId);
        Task<int> GetActiveRents(int userId);
    }

    public class UserService : IUserService
    {
        private readonly BerautoDbContext _context;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;

        public UserService(BerautoDbContext context, IMapper mapper, IConfiguration configuration)
        {
            _context = context;
            _mapper = mapper;
            _configuration = configuration;
        }

        public async Task<UserDto> AddUser(CreateUserDto userDto)
        {
            var user = _mapper.Map<User>(userDto);
            user.Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password);
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
        public async Task<string> LoginAsync(UserLoginDto userDto)
        {
            var user = await _context.Users
                                     .Include(u => u.Roles)
                                     .FirstOrDefaultAsync(x => x.Email == userDto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(userDto.Password, user.Password))
            {
                throw new UnauthorizedAccessException("Invalid credentials.");
            }

            return await GenerateToken(user);
        }

        private async Task<string> GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(Convert.ToDouble(_configuration["Jwt:ExpireDays"]));

            var id = await GetClaimsIdentity(user);
            var token = new JwtSecurityToken(_configuration["Jwt:Issuer"], _configuration["Jwt:Audience"], id.Claims, expires: expires, signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<ClaimsIdentity> GetClaimsIdentity(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Sid, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.AuthTime, DateTime.Now.ToString(CultureInfo.InvariantCulture))
            };

            if (user.Roles != null && user.Roles.Any())
            {
                claims.AddRange(user.Roles.Select(role => new Claim("roleIds", role.Id.ToString())));

                claims.AddRange(user.Roles.Select(role => new Claim(ClaimTypes.Role, role.Name)));
            }

            return new ClaimsIdentity(claims, "Token");
        }

        public async Task<UserDto> RegisterAsync(CreateUserDto userDto)
        {
            if (await _context.Users.AnyAsync(u => u.UserName == userDto.UserName || u.Email == userDto.Email))
            {
                throw new ArgumentException("Username or Email already exists.");
            }

            var user = _mapper.Map<User>(userDto);
            user.Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password);

            user.Roles = new List<Role>(); 
            var defaultRoleName = "User";

            var userRoleEntity = await _context.Roles
                                               .FirstOrDefaultAsync(r => r.Name == defaultRoleName);

            if (userRoleEntity != null)
            {
                user.Roles.Add(userRoleEntity);
            }
            else
            {
                throw new InvalidOperationException($"Default role '{defaultRoleName}' not found in the database. Registration cannot proceed.");
            }

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var createdUser = await _context.Users
                                      .Include(u => u.Address)
                                      .Include(u => u.Roles)
                                      .FirstOrDefaultAsync(u => u.Id == user.Id);

            return _mapper.Map<UserDto>(createdUser);
        }

        public async Task<int> GetUserRents(int userId)
        {
            var rents = await _context.Rents
                .Where(r => r.UserId == userId)
                .ToListAsync();

            if (rents == null || rents.Count == 0)
            {
                throw new ArgumentException("No rents found for this user.");
            }

            return rents.Count;
        }

        public async Task<int> GetActiveRents(int userId)
        {
            var rents = await _context.Rents
                .Where(r => r.UserId == userId && r.Finished == false)
                .ToListAsync();
            if (rents == null || rents.Count == 0)
            {
                throw new ArgumentException("No active rents found for this user.");
            }
            return rents.Count;
        }
    }
}
