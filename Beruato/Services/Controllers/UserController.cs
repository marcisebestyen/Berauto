using System.Security.Claims;
using AutoMapper;
using Database.Dtos.UserDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Services.Services;

namespace Berauto.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : Controller
{
    private readonly IUserService _userService;
    private readonly ILogger<UserController> _logger;
    private readonly IMapper _mapper;

    public UserController(IUserService userService, ILogger<UserController> logger,  IMapper mapper)
    {
        _userService = userService ?? throw new ArgumentNullException(nameof(userService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    /// <summary>
    /// Lekérdezi egy felhasználó profiladatait az azonosítója alapján.
    /// </summary>
    /// <param name="userId">A lekérdezendő felhasználó azonosítója.</param>
    /// <returns>A felhasználó profiladatai.</returns>
    [Authorize] 
    [HttpGet("getProfile")] 
    [ProducesResponseType(typeof(UserGetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetCurrentUserIdFromToken();
        var userDto = await _userService.GetUserByIdAsync(userId);
        
        if (userDto == null)
        {
            _logger?.LogInformation("User profile not found for user ID: {RequestedUserId}", userId);
            return NotFound(new { Message = $"A(z) {userId} azonosítójú felhasználói profil nem található." });
        }

        return Ok(userDto);
    }

    /// <summary>
    /// Részlegesen frissíti egy felhasználó profiladatait az azonosítója alapján.
    /// </summary>
    /// <param name="userId">A frissítendő felhasználó azonosítója.</param>
    /// <param name="patchDoc">A JSON Patch dokumentum, ami a módosításokat tartalmazza.</param>
    /// <returns>HTTP státuszkód a művelet eredményéről.</returns>
    [Authorize]
    [HttpPatch("updateProfile")] // HTTP metódus cserélve PATCH-re
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)] // ModelState hibák vagy patch hibák
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)] // Pl. email ütközés
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateUserProfile([FromBody] JsonPatchDocument<UserUpdateDto> patchDoc)
    {
        var userId = GetCurrentUserIdFromToken();
        
        if (patchDoc == null)
        {
            return BadRequest(new { Message = "A PATCH dokumentum nem lehet üres." });
        }

        //    A UserGetDto-t használjuk, majd átalakítjuk UserUpdateDto-ra.
        var userGetDto = await _userService.GetUserByIdAsync(userId);
        if (userGetDto == null)
        {
            return NotFound(
                new { Message = $"A(z) {userId} azonosítójú felhasználó nem található a PATCH művelethez." });
        }
        
        var userToPatchDto = _mapper.Map<UserUpdateDto>(userGetDto);

        // A ModelState-et átadjuk, hogy az ApplyTo bele tudja írni a patch alkalmazása során keletkező hibákat
        // (pl. ha egy nem létező property-t próbál módosítani).
        patchDoc.ApplyTo(userToPatchDto, ModelState);

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Újraellenőrizzük a DTO-t a patch után, hogy a benne lévő DataAnnotation attribútumok (pl. StringLength)
        // érvényesek-e a módosított értékekre.
        TryValidateModel(userToPatchDto);
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // A UserService.UpdateUserAsync logikája változatlan, az kezeli a DTO alapján a tényleges entitásfrissítést.
        var result = await _userService.UpdateUserAsync(userId, userToPatchDto);

        if (result.Succeeded)
        {
            return NoContent();
        }

        // Hibakezelés a ServiceResult alapján (hasonlóan a PUT-hoz)
        if (result.Errors.Any())
        {
            string firstError = result.Errors.First().ToLowerInvariant();
            if (firstError.Contains("nem található"))
            {
                return NotFound(new { Errors = result.Errors });
            }

            if (firstError.Contains("már foglalt")) // Pl. email cím ütközés
            {
                return Conflict(new { Errors = result.Errors });
            }

            return BadRequest(new { Errors = result.Errors });
        }

        _logger?.LogError("UpdateUserProfile (PATCH) failed for user ID {UpdatedUserId} without specific errors.",
            userId);
        return StatusCode(StatusCodes.Status500InternalServerError,
            new { Message = "Ismeretlen hiba történt a profil frissítése közben." });
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(UserGetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { Message = "Érvénytelen bemeneti adatok.", Errors = errors });
        }

        var loginResult = await _userService.LoginAsync(loginDto);

        if (!loginResult.Succeeded)
        {
            _logger.LogWarning("Login failed for identifier: {Identifier}. Errors: {Errors}", loginDto.Identifier,
                string.Join(", ", loginResult.Errors));
            return Unauthorized(new { Message = "Hibás felhasználónév/e-mail cím vagy jelszó." });
        }

        return Ok(new { User = loginResult.User, Token = loginResult.Token });
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(UserGetDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object),
        StatusCodes.Status400BadRequest)] // Validációs hibák vagy üzleti logikai hibák (pl. email foglalt)
    [ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] UserCreateDto registrationDto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { Message = "Érvénytelen bemeneti adatok.", Errors = errors });
        }

        var registrationResult = await _userService.RegisterAsync(registrationDto);

        if (!registrationResult.Succeeded)
        {
            return BadRequest(new { Errors = registrationResult.Errors });
        }

        // Sikeres regisztráció esetén 201 Created választ adunk vissza,
        // a válasz body-jában az új felhasználó adataival (UserGetDto),
        // és a Location headerben az új erőforrás URI-jával (opcionális, de jó gyakorlat).
        return CreatedAtAction(nameof(GetMyProfile), new { userId = registrationResult.User.Id },
            registrationResult.User);
    }

    /// <summary>
    /// Segédfüggvény a bejelentkezett felhasználó azonosítójának kinyerésére.
    /// </summary>
    /// <returns>A felhasználó azonosítója.</returns>
    /// <exception cref="UnauthorizedAccessException">Ha a felhasználói azonosító nem található vagy érvénytelen.</exception>
    private int GetCurrentUserIdFromToken()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            // Ez a helyzet elvileg nem fordulhatna elő, ha az [Authorize] attribútum aktív
            // és a token érvényes és tartalmazza a NameIdentifier claim-et.
            // Ha mégis, az komoly konfigurációs vagy token generálási hibára utal.
            _logger.LogError("User ID claim (NameIdentifier) not found or invalid in token for an authorized request.");
            throw new UnauthorizedAccessException(
                "A felhasználói azonosító (ClaimTypes.NameIdentifier) nem található vagy érvénytelen a tokenben, annak ellenére, hogy a kérés authentikált.");
        }
        return userId;
    }
}