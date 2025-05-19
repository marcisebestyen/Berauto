using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Database.Dtos.UserDtos;
using Database.Models;
using Database.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Services.Repositories;

namespace Services.Services;

public interface IUserService
{
    Task<UserGetDto?> GetUserByIdAsync(int userId);
    Task<ServiceResult> UpdateUserAsync(int userId, UserUpdateDto userUpdateDto);
    Task<LoginResult> LoginAsync(UserLoginDto loginDto);
    Task<RegistrationResult> RegisterAsync(UserCreateDto registrationDto);
    Task<User> GetOrCreateGuestUserAsync(UserCreateGuestDto guestDto);
    Task<bool> CheckEmailExistsAndRegisteredAsync(string email);
    Task<ServiceResult> ResetPasswordAsync(string email, string newPassword);
}

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;
    private readonly IConfiguration _configuration;

    public UserService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<UserService> logger,
        IConfiguration configuration)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
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
            // Ellenőrizzük, hogy az új email cím nem foglalt-e már más felhasználó által
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

        // Nem engedjük módosítani: Id, UserName, RegisteredUser, Role, Password ezen a végponton.
        // A jelszó módosítására külön funkció kell.
        // A UserName általában nem módosítható a regisztráció után.
        // A Role módosítása adminisztrátori jogosultságot igényel.

        if (!changed)
        {
            return ServiceResult.Success(); // Nem történt változás
        }

        try
        {
            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.SaveAsync();
            return ServiceResult.Success();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Konkurrencia probléma: valaki más módosította az adatot közben.
            // Lehet újrapróbálkozni, vagy a felhasználót értesíteni.
            return ServiceResult.Failed("Az adatokat időközben valaki más módosította. Kérjük, próbálja újra.");
        }
        catch (DbUpdateException ex)
        {
            // Általános adatbázis frissítési hiba (pl. unique constraint sérülés, amit fentebb nem kezeltünk expliciten)
            // Logolás javasolt: _logger.LogError(ex, "Hiba történt a felhasználó adatainak frissítésekor.");
            return ServiceResult.Failed(
                $"Adatbázis hiba történt a frissítés során: {ex.InnerException?.Message ?? ex.Message}");
        }
        catch (Exception ex) // Egyéb váratlan hibák
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
            // Általános hibaüzenet, hogy ne adjunk információt arról, hogy a felhasználó létezik-e.
            return LoginResult.Failure("Hibás e-mail cím vagy jelszó.");
        }

        if (!user.RegisteredUser)
        {
            // Vendégfelhasználó: jelszó nem szükséges, token sem kell
            var usersGetDto = _mapper.Map<UserGetDto>(user);
            return LoginResult.Success(usersGetDto, token: "");
        }

        if (string.IsNullOrWhiteSpace(loginDto.Password))
        {
            return LoginResult.Failure("A jelszó megadása kötelező.");
        }

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password);

        if (!isPasswordValid)
        {
            return LoginResult.Failure("Hibás e-mail cím vagy jelszó.");
        }

        // Sikeres hitelesítés, JWT token generálása
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ??
                                          throw new InvalidOperationException("JWT Key not configured."));

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
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
        var tokenString = tokenHandler.WriteToken(token);

        var userGetDto = _mapper.Map<UserGetDto>(user);

        return LoginResult.Success(userGetDto, tokenString);
    }

    public async Task<RegistrationResult> RegisterAsync(UserCreateDto registrationDto)
    {
        if (registrationDto == null)
        {
            return RegistrationResult.Failure("A regisztrációs adatok nem lehetnek üresek.");
        }

        // Ellenőrizzük, hogy az e-mail cím foglalt-e már
        var existingUserByEmail = (await _unitOfWork.UserRepository.GetAsync(u => u.Email == registrationDto.Email))
            .FirstOrDefault();
        if (existingUserByEmail != null)
        {
            return RegistrationResult.Failure("Ez az e-mail cím már regisztrálva van.");
        }

        // UserName generálása/beállítása (itt az Email-t használjuk, de lehetne bonyolultabb logika is)
        // és ellenőrizzük az egyediségét.
        string userNameToRegister = registrationDto.Email; // Egyszerűsített UserName
        var existingUserByUserName = (await _unitOfWork.UserRepository.GetAsync(u => u.UserName == userNameToRegister))
            .FirstOrDefault();
        if (existingUserByUserName != null)
        {
            // Ha az email egyedi, de a UserName (ami itt ugyanaz) valahogy mégis foglalt, az adatbázis anomália
            // vagy a UserName generálási logika bonyolultabb és ütközést okozott.
            // Egyedi UserName-t kell biztosítani. Lehet pl. egyedi stringet generálni.
            return RegistrationResult.Failure(
                "A felhasználónév már foglalt. Próbálkozzon másikkal, vagy ez az email már használatban van felhasználónévként.");
        }

        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(registrationDto.Password);
        // string hashedPassword = registrationDto.Password; 

        var newUser = new User
        {
            FirstName = registrationDto.FirstName,
            LastName = registrationDto.LastName,
            PhoneNumber = registrationDto.PhoneNumber,
            LicenceId = registrationDto.LicenceId,
            Email = registrationDto.Email,
            UserName = userNameToRegister,
            Password = hashedPassword,
            RegisteredUser = true,
            Role = Role.Renter
        };

        try
        {
            await _unitOfWork.UserRepository.InsertAsync(newUser);
            await _unitOfWork.SaveAsync();
        }
        catch (DbUpdateException ex) // Általános adatbázis hiba, pl. unique constraint sérülés, amit fent nem kezeltünk
        {
            return RegistrationResult.Failure(
                $"Adatbázis hiba történt a regisztráció során: {ex.InnerException?.Message ?? ex.Message}");
        }
        catch (Exception ex) // Egyéb váratlan hibák
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

        // Próbáljuk megkeresni a felhasználót email alapján
        var existingUser = (await _unitOfWork.UserRepository.GetAsync(u => u.Email == guestDto.Email)).FirstOrDefault();

        if (existingUser != null)
        {
            // Ha létezik, és nem regisztrált, vagy ha regisztrált, de az adatok egyeznek (ezt finomítani kellhet)
            // Most egyszerűen visszaadjuk, ha létezik. Fontold meg, mi történjen, ha már regisztrált felhasználó próbál vendégként foglalni.
            // Lehet, hogy frissíteni kell a meglévő vendég adatait, ha változtak.
            _logger.LogInformation("Guest user found with email: {Email}, ID: {UserId}", guestDto.Email, existingUser.Id);
            return existingUser;
        }

        // Ha nem létezik, hozzunk létre egy újat
        var newUser = new User
        {
            FirstName = guestDto.FirstName,
            LastName = guestDto.LastName,
            Email = guestDto.Email,
            UserName = guestDto.Email, // Kezdetben az UserName lehet az Email
            PhoneNumber = guestDto.PhoneNumber,
            LicenceId = guestDto.LicenceId,
            RegisteredUser = false, // Fontos: Ez egy vendég fiók
            Password = null,        // Nincs jelszó, vagy egy nem használható placeholder
            Role = Role.Renter      // Alapértelmezett szerepkör
        };

        await _unitOfWork.UserRepository.InsertAsync(newUser);
        await _unitOfWork.SaveAsync();
        _logger.LogInformation("New guest user created with email: {Email}, ID: {UserId}", guestDto.Email, newUser.Id);
        return newUser;
    }


    public async Task<bool> CheckEmailExistsAndRegisteredAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            _logger.LogWarning("CheckEmailExistsAndRegisteredAsync called with empty email.");
            return false;
        }

        var user =
            (await _unitOfWork.UserRepository.GetAsync(u => u.Email == email && u.RegisteredUser)).FirstOrDefault();

        return user != null;
    }

    public async Task<ServiceResult> ResetPasswordAsync(string email, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(newPassword))
        {
            _logger.LogWarning("ResetPasswordAsync called with empty email and password.");
            return ServiceResult.Failed("Az e-mail cím és az új jelszó megadása kötelező.");
        }

        var user =
            (await _unitOfWork.UserRepository.GetAsync(u => u.Email == email && u.RegisteredUser)).FirstOrDefault();

        if (user == null)
        {
            _logger.LogWarning("DirectResetPasswordAsync called for non-existent or non-registered user email: {Email}",
                email);
            return ServiceResult.Failed("A megadott e-mail címmel nem található regisztrált felhasználó.");
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);

        try
        {
            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.SaveAsync();
            _logger.LogInformation(
                "Password directly reset for user {UserId} (Email: {Email}) in university project mode.", user.Id,
                email);
            return ServiceResult.Success("A jelszó sikeresen megváltoztatva.");
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error during direct password reset for email {Email}", email);
            return ServiceResult.Failed($"Adatbázis hiba történt: {dbEx.InnerException?.Message ?? dbEx.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during direct password reset for email {Email}", email);
            return ServiceResult.Failed("Váratlan hiba történt a jelszó módosítása közben.");
        }
    }
}