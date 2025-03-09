using Database.Models;
using Microsoft.AspNetCore.Mvc;
using Database.Dtos;
namespace Beruato.Controller;

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
    public async Task<IActionResult> AddUser([FromBody]CreateUserDto userDto)
    {
        try
        {
            var user = await _userService.AddUser(userDto);
            return CreatedAtAction(nameof(GetUser), new { userId = user.Id }, user);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUser(int userId)
    {
        try
        {
            var user = await _userService.GetUser(userId);
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        try
        {
            var users = await _userService.GetUsers();
            return Ok(users);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody]UpdateUserDto updateUserDto)
    {
        try
        {
            var user = await _userService.UpdateUser(userId, updateUserDto);
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        try
        {
            var result = await _userService.DeleteUser(userId);
            if (!result)
            {
                return NotFound(new { message = "User not found." });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
