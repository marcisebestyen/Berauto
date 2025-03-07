using Database.Models;
using Microsoft.AspNetCore.Mvc;
using Database.Dtos;

namespace Beruato.Controllers;


[ApiController]
[Route("[controller]/[action]")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPost]
    public async Task<IActionResult> AddUser([FromBody] CreateUserDto userDto)
    {
        try
        {
            var createdUser = await _userService.AddUser(userDto);
            return CreatedAtAction(nameof(GetAddress), new { userId = createdUser.Id }, createdUser);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public IActionResult GetAddress(int userId)
    {
        var result = _userService.GetAddress(userId);
        return Ok(result);
    }

    [HttpGet]
    public IActionResult GetEmail(int userId)
    {
        var result = _userService.GetEmail(userId);
        return Ok(result);
    }

    [HttpGet]
    public IActionResult GetPhoneNumber(int userId)
    {
        var result = _userService.GetPhoneNumber(userId);
        return Ok(result);
    }
}
