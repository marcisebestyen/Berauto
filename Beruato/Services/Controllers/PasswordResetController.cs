using Database.Dtos;
using Microsoft.AspNetCore.Authorization;
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
    [AllowAnonymous]
    public async Task<IActionResult> InitiatePasswordReset([FromBody] InitiatePasswordResetRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _passwordResetService.InitiatePasswordResetAsync(request.Email);

            return Ok(new { message = result.Messages });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in InitiatePasswordReset");
            return StatusCode(500, new { message = "Szerver hiba történt." });
        }
    }


    [HttpPost("reset")]
    [AllowAnonymous]
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
}