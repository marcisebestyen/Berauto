using AutoMapper;
using Database.Dtos;
using Database.Dtos.UserDtos;
using Database.Models;
using Database.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Services.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using User = Database.Models.User;

namespace Services.Services;

public interface IUserService
{
    Task<UserGetDto?> GetUserByIdAsync(int userId);
    Task<ServiceResult> UpdateUserAsync(int userId, UserUpdateDto userUpdateDto);
    Task<LoginResult> LoginAsync(UserLoginDto loginDto);
    Task<RegistrationResult> RegisterAsync(UserCreateDto registrationDto);
    Task<User> GetOrCreateGuestUserAsync(UserCreateGuestDto guestDto);

    Task<LoginResult> LoginWithGoogleAsync(GoogleLoginDto googleLoginDto);
}

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;
    private readonly IConfiguration _configuration;
    private readonly Supabase.Client _supabaseClient;

    public UserService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<UserService> logger,
        IConfiguration configuration, Supabase.Client supabaseClient)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _supabaseClient = supabaseClient ?? throw new ArgumentNullException(nameof(supabaseClient));
    }

    public async Task<UserGetDto?> GetUserByIdAsync(int userId)
    {
        var user = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { userId });

        if (user == null)
        {
            return null;
        }

        return _mapper.Map<UserGetDto>(user);
    }

    public async Task<ServiceResult> UpdateUserAsync(int userId, UserUpdateDto userUpdateDto)
    {
        var user = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { userId });

        if (user == null)
        {
            return ServiceResult.Failed("A módosítandó felhasználó nem található.");
        }

        if (!user.RegisteredUser)
        {
            return ServiceResult.Failed("Csak regisztrált felhasználók módosíthatják az adataikat.");
        }

        bool changed = false;

        if (userUpdateDto.FirstName != null && user.FirstName != userUpdateDto.FirstName)
        {
            user.FirstName = userUpdateDto.FirstName;
            changed = true;
        }

        if (userUpdateDto.LastName != null && user.LastName != userUpdateDto.LastName)
        {
            user.LastName = userUpdateDto.LastName;
            changed = true;
        }

        if (userUpdateDto.PhoneNumber != null && user.PhoneNumber != userUpdateDto.PhoneNumber)
        {
            user.PhoneNumber = userUpdateDto.PhoneNumber;
            changed = true;
        }

        if (userUpdateDto.LicenceId != null && user.LicenceId != userUpdateDto.LicenceId)
        {
            user.LicenceId = userUpdateDto.LicenceId;
            changed = true;
        }

        if (userUpdateDto.Email != null && user.Email != userUpdateDto.Email)
        {
            var existingUserWithEmail =
                (await _unitOfWork.UserRepository.GetAsync(u => u.Email == userUpdateDto.Email && u.Id != user.Id))
                .FirstOrDefault();
            if (existingUserWithEmail != null)
            {
                return ServiceResult.Failed("Az email cím már foglalt egy másik felhasználó által.");
            }

            user.Email = userUpdateDto.Email;
            changed = true;
        }

        if (userUpdateDto.Address != null && user.Address != userUpdateDto.Address)
        {
            user.Address = userUpdateDto.Address;
            changed = true;
        }

        if (!changed)
        {
            return ServiceResult.Success();
        }

        try
        {
            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.SaveAsync();
            return ServiceResult.Success();
        }
        catch (DbUpdateConcurrencyException)
        {
            return ServiceResult.Failed("Az adatokat időközben valaki más módosította. Kérjük, próbálja újra.");
        }
        catch (DbUpdateException ex)
        {
            return ServiceResult.Failed(
                $"Adatbázis hiba történt a frissítés során: {ex.InnerException?.Message ?? ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Váratlan hiba történt a felhasználó adatainak frissítésekor.");
            return ServiceResult.Failed($"Váratlan hiba történt: {ex.Message}");
        }
    }

    public async Task<LoginResult> LoginAsync(UserLoginDto loginDto)
    {
        if (loginDto == null || string.IsNullOrWhiteSpace(loginDto.Identifier) ||
            string.IsNullOrWhiteSpace(loginDto.Password))
        {
            return LoginResult.Failure("Az e-mail cím és a jelszó megadása kötelező.");
        }

        var user = (await _unitOfWork.UserRepository.GetAsync(u =>
            u.Email == loginDto.Identifier || u.UserName == loginDto.Identifier)).FirstOrDefault();

        if (user == null)
        {
            return LoginResult.Failure("Hibás e-mail cím vagy jelszó.");
        }

        if (!user.RegisteredUser)
        {
            var usersGetDto = _mapper.Map<UserGetDto>(user);
            return LoginResult.Success(usersGetDto, token: "");
        }

        if (string.IsNullOrWhiteSpace(loginDto.Password))
        {
            return LoginResult.Failure("A jelszó megadása kötelező.");
        }

        if (user.Password == null)
        {
            return LoginResult.Failure("Kérjük jelentkezzen be Google fiókjával.");
        }

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password);

        if (!isPasswordValid)
        {
            return LoginResult.Failure("Hibás e-mail cím vagy jelszó.");
        }

        // Itt hívjuk meg a közös Token generátort
        var tokenString = GenerateJwtToken(user);
        var userGetDto = _mapper.Map<UserGetDto>(user);

        return LoginResult.Success(userGetDto, tokenString);
    }

    public async Task<LoginResult> LoginWithGoogleAsync(GoogleLoginDto googleLoginDto)
    {
        try
        {
            var supabaseUser = await _supabaseClient.Auth.GetUser(googleLoginDto.AccessToken);

            if (supabaseUser == null)
            {
                return LoginResult.Failure("Érvénytelen Google bejelentkezés.");
            }

            var email = supabaseUser.Email;

            if (string.IsNullOrEmpty(email))
            {
                return LoginResult.Failure("Nem sikerült lekérni az email címet a szolgáltatótól.");
            }

            var dbUser = (await _unitOfWork.UserRepository.GetAsync(u => u.Email == email)).FirstOrDefault();

            if (dbUser == null)
            {
                string firstName = "Google";
                string lastName = "User";

                if (supabaseUser.UserMetadata != null && supabaseUser.UserMetadata.ContainsKey("full_name"))
                {
                    var fullName = supabaseUser.UserMetadata["full_name"]?.ToString();
                    if (!string.IsNullOrWhiteSpace(fullName))
                    {
                        var parts = fullName.Split(' ');
                        firstName = parts.FirstOrDefault() ?? "Google";
                        lastName = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "User";
                    }
                }

                dbUser = new User
                {
                    Email = email,
                    UserName = email,
                    FirstName = firstName,
                    LastName = lastName,
                    RegisteredUser = true,
                    Role = Role.Renter,
                    Password = null,
                    PhoneNumber = "",
                    LicenceId = "",
                    Address = ""
                };

                await _unitOfWork.UserRepository.InsertAsync(dbUser);
                await _unitOfWork.SaveAsync();
            }
            var tokenString = GenerateJwtToken(dbUser);
            var userGetDto = _mapper.Map<UserGetDto>(dbUser);

            return LoginResult.Success(userGetDto, tokenString);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Hiba történt a Google bejelentkezés során.");
            return LoginResult.Failure($"Hiba történt a bejelentkezés során: {ex.Message}");
        }
    }

    private string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ??
                                          throw new InvalidOperationException("JWT Key not configured."));

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName ?? user.Email),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(Convert.ToDouble(jwtSettings["ExpireDays"])),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials =
                new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<RegistrationResult> RegisterAsync(UserCreateDto registrationDto)
    {
        if (registrationDto == null)
        {
            return RegistrationResult.Failure("A regisztrációs adatok nem lehetnek üresek.");
        }

        var existingUserByEmail = (await _unitOfWork.UserRepository.GetAsync(u => u.Email == registrationDto.Email))
            .FirstOrDefault();
        if (existingUserByEmail != null)
        {
            return RegistrationResult.Failure("Ez az e-mail cím már regisztrálva van.");
        }

        string userNameToRegister = registrationDto.Email;
        var existingUserByUserName = (await _unitOfWork.UserRepository.GetAsync(u => u.UserName == userNameToRegister))
            .FirstOrDefault();
        if (existingUserByUserName != null)
        {
            return RegistrationResult.Failure(
                "A felhasználónév már foglalt. Próbálkozzon másikkal, vagy ez az email már használatban van felhasználónévként.");
        }

        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(registrationDto.Password);

        var newUser = new User
        {
            FirstName = registrationDto.FirstName,
            LastName = registrationDto.LastName,
            Email = registrationDto.Email,
            UserName = registrationDto.UserName,
            PhoneNumber = registrationDto.PhoneNumber,
            LicenceId = registrationDto.LicenceId,
            RegisteredUser = true,
            Password = hashedPassword,
            Role = Role.Renter,
            Address = registrationDto.Address
        };

        try
        {
            await _unitOfWork.UserRepository.InsertAsync(newUser);
            await _unitOfWork.SaveAsync();
        }
        catch (DbUpdateException ex)
        {
            return RegistrationResult.Failure(
                $"Adatbázis hiba történt a regisztráció során: {ex.InnerException?.Message ?? ex.Message}");
        }
        catch (Exception ex)
        {
            return RegistrationResult.Failure($"Váratlan hiba történt a regisztráció során: {ex.Message}");
        }

        var userGetDto = _mapper.Map<UserGetDto>(newUser);

        return RegistrationResult.Success(userGetDto);
    }

    public async Task<User> GetOrCreateGuestUserAsync(UserCreateGuestDto guestDto)
    {
        if (guestDto == null || string.IsNullOrWhiteSpace(guestDto.Email))
        {
            throw new ArgumentException("Vendég adatok vagy email cím hiányzik.");
        }

        var existingUser = (await _unitOfWork.UserRepository.GetAsync(u => u.Email == guestDto.Email)).FirstOrDefault();

        if (existingUser != null)
        {
            _logger.LogInformation("Guest user found with email: {Email}, ID: {UserId}", guestDto.Email,
                existingUser.Id);
            return existingUser;
        }

        var newUser = new User
        {
            FirstName = guestDto.FirstName,
            LastName = guestDto.LastName,
            Email = guestDto.Email,
            UserName = guestDto.Email,
            PhoneNumber = guestDto.PhoneNumber,
            LicenceId = guestDto.LicenceId,
            RegisteredUser = false,
            Password = null,
            Role = Role.Renter
        };

        await _unitOfWork.UserRepository.InsertAsync(newUser);
        await _unitOfWork.SaveAsync();
        _logger.LogInformation("New guest user created with email: {Email}, ID: {UserId}", guestDto.Email, newUser.Id);
        return newUser;
    }
}