using AutoMapper;
using Database.Dtos;
using Database.Dtos.UserDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Services.Services;
using System.Security.Claims;

namespace Berauto.Controllers;

[ApiController]
[Route("api/users")]
[AllowAnonymous]
public class UserController : Controller
{
    private readonly IUserService _userService;
    private readonly ILogger<UserController> _logger;
    private readonly IMapper _mapper;

    public UserController(IUserService userService, ILogger<UserController> logger, IMapper mapper)
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
    [HttpPatch("updateProfile")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateUserProfile([FromBody] JsonPatchDocument<UserUpdateDto> patchDoc)
    {
        var userId = GetCurrentUserIdFromToken();

        if (patchDoc == null)
        {
            return BadRequest(new { Message = "A PATCH dokumentum nem lehet üres." });
        }

        var userGetDto = await _userService.GetUserByIdAsync(userId);
        if (userGetDto == null)
        {
            return NotFound(
                new { Message = $"A(z) {userId} azonosítójú felhasználó nem található a PATCH művelethez." });
        }

        var userToPatchDto = _mapper.Map<UserUpdateDto>(userGetDto);

        patchDoc.ApplyTo(userToPatchDto, ModelState);

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        TryValidateModel(userToPatchDto);
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _userService.UpdateUserAsync(userId, userToPatchDto);

        if (result.Succeeded)
        {
            return NoContent();
        }

        if (result.Errors.Any())
        {
            string firstError = result.Errors.First().ToLowerInvariant();
            if (firstError.Contains("nem található"))
            {
                return NotFound(new { Errors = result.Errors });
            }

            if (firstError.Contains("már foglalt"))
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
        StatusCodes.Status400BadRequest)]
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

        return CreatedAtAction(nameof(GetMyProfile), new { userId = registrationResult.User.Id },
            registrationResult.User);
    }

    [HttpPost("google-login")]
    [ProducesResponseType(typeof(UserGetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto googleLoginDto)
    {
        // Ez a kód hiányzik most a szerveredről!
        if (googleLoginDto == null || string.IsNullOrWhiteSpace(googleLoginDto.AccessToken))
        {
            return BadRequest(new { Message = "A token megadása kötelező." });
        }

        var result = await _userService.LoginWithGoogleAsync(googleLoginDto);

        if (!result.Succeeded)
        {
            return BadRequest(new { Message = result.Errors.FirstOrDefault() ?? "Hiba történt a Google bejelentkezés során." });
        }

        return Ok(new { Token = result.Token, User = result.User });
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
            _logger.LogError("User ID claim (NameIdentifier) not found or invalid in token for an authorized request.");
            throw new UnauthorizedAccessException(
                "A felhasználói azonosító (ClaimTypes.NameIdentifier) nem található vagy érvénytelen a tokenben, annak ellenére, hogy a kérés authentikált.");
        }

        return userId;
    }


}