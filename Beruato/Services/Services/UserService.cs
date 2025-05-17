using AutoMapper;
using Database.Dtos.UserDtos;
using Database.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Services.Repositories;

namespace Services.Services;

public interface IUserService
{
    Task<UserGetDto?> GetUserByIdAsync(int userId);
    Task<ServiceResult> UpdateUserAsync(int userId, UserUpdateDto userUpdateDto);
    Task<LoginResult> LoginAsync(UserLoginDto loginDto); 

}

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;

    public UserService(IUnitOfWork unitOfWork,  IMapper mapper,  ILogger<UserService> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mapper  = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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
            var existingUserWithEmail = (await _unitOfWork.UserRepository.GetAsync(u => u.Email == userUpdateDto.Email && u.Id != user.Id)).FirstOrDefault();
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
        if (loginDto == null || string.IsNullOrWhiteSpace(loginDto.Identifier) || string.IsNullOrWhiteSpace(loginDto.Password))
        {
            return LoginResult.Failure("Az e-mail cím és a jelszó megadása kötelező.");
        }

        var user = (await _unitOfWork.UserRepository.GetAsync(u => u.Email == loginDto.Identifier || u.UserName == loginDto.Identifier)).FirstOrDefault();

        if (user == null)
        {
            // Általános hibaüzenet, hogy ne adjunk információt arról, hogy a felhasználó létezik-e.
            return LoginResult.Failure("Hibás e-mail cím vagy jelszó.");
        }

        if (!user.RegisteredUser)
        {
            return LoginResult.Failure("Ez a felhasználói fiók nem aktív vagy nem regisztrált.");
        }

        // !!! FONTOS BIZTONSÁGI FIGYELMEZTETÉS !!!
        // Az alábbi jelszó-ellenőrzés NEM BIZTONSÁGOS és csak demonstrációs célokat szolgál!
        // Éles környezetben SOHA ne tárolj plain text jelszavakat és ne így ellenőrizd őket!
        // Használj biztonságos jelszó hash-elési eljárást (pl. BCrypt, Argon2).
        // Regisztrációkor a jelszót hash-elni kell, és itt a kapott jelszót kell összehasonlítani a tárolt hash-sel.
        // Példa (feltételezve, hogy user.Password a hash, és van egy _passwordHasherService.VerifyPassword metódusod):
        // bool isPasswordValid = _passwordHasherService.VerifyPassword(user.Password, loginDto.Password);

        // Jelenlegi egyszerűsített (ÉS NEM BIZTONSÁGOS) ellenőrzés:
        bool isPasswordValid = user.Password == loginDto.Password;
        // Ha a fentebbi feltételezett _passwordHasherService-t használnád:
        // bool isPasswordValid = _passwordHasherService.Verify(user.PasswordHash, loginDto.Password); // Vagy valami hasonló

        if (!isPasswordValid)
        {
            return LoginResult.Failure("Hibás e-mail cím vagy jelszó.");
        }

        // Sikeres hitelesítés
        var userGetDto = new UserGetDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            RegisteredUser = user.RegisteredUser,
            LicenceId = user.LicenceId,
            Email = user.Email
            // A Name property a UserGetDto-ban automatikusan képződik.
        };

        // Mivel egyelőre nincs JWT, itt nem generálunk tokent.
        // A sikeres bejelentkezés eredményeként visszaadjuk a felhasználó adatait.
        return LoginResult.Success(userGetDto);
    }
}