using Database.Models;
using Microsoft.AspNetCore.Mvc;
using Database.Dtos;

namespace Beruato.Controllers;


[ApiController]
[Route("[controller]/[action]")]
public class BerautoUserController : ControllerBase
{
    private readonly IUserService _userService;

    public BerautoUserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPost]
    public IActionResult AddUser([FromBody] UserDto userDto)
    {
        try
        {
            _userService.AddUser(userDto);
            return CreatedAtAction(nameof(GetAddress), new { userId = userDto.Id }, userDto);
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
    public IActionResult GetFullname(int userId)
    {
        var result = _userService.GetFullName(userId);
        return Ok(result);
    }

    [HttpGet]
    public IActionResult GetPhoneNumber(int userId)
    {
        var result = _userService.GetPhoneNumber(userId);
        return Ok(result);
    }
}
