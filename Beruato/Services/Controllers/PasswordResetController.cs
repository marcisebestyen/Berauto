using System.Security.Claims;
using Database.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Services.Services;

namespace Services.Controllers;

[ApiController]
[Route("api/password_reset")]
public class PasswordResetController : ControllerBase
{
    private readonly IPasswordResetService _passwordResetService;
    private readonly ILogger<PasswordResetController> _logger;

    public PasswordResetController(
        IPasswordResetService passwordResetService,
        ILogger<PasswordResetController> logger)
    {
        _passwordResetService = passwordResetService;
        _logger = logger;
    }
    
    [HttpPost("initiate")]
    [Authorize]
    public async Task<IActionResult> InitiatePasswordReset()
    {
        try
        {
            var userId = GetCurrentUserIdFromToken();
            var result = await _passwordResetService.InitiatePasswordResetAsync(userId);

            if (result.Succeeded)
            {
                return Ok(new { message = result.Messages });
            }

            return BadRequest(new { message = result.Messages });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogError(ex, "Unauthorized access in InitiatePasswordReset");
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in InitiatePasswordReset");
            return StatusCode(500, new { message = "Szerver hiba történt." });
        }
    }

    
    [HttpPost("reset")]
    public async Task<IActionResult> ResetPassword([FromBody] PasswordResetRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _passwordResetService.ValidateAndResetPasswordAsync(
            request.Token, 
            request.NewPassword
        );

        if (result.Succeeded)
        {
            return Ok(new { message = result.Messages });
        }

        return BadRequest(new { message = result.Messages });
    }

    private int GetCurrentUserIdFromToken()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            _logger.LogError("User ID claim (NameIdentifier) not found or invalid in token.");
            throw new UnauthorizedAccessException(
                "A felhasználói azonosító nem található vagy érvénytelen a tokenben.");
        }

        return userId;
    }
}