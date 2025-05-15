using Database.Models;
using Microsoft.AspNetCore.Mvc;
using Database.Dtos;
using Microsoft.AspNetCore.Authorization;
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
    [AllowAnonymous]
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
    [Authorize(Roles = "Admin")]
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
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUser()
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
    [Authorize(Roles = "Admin, User, Director")]

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
    [Authorize(Roles = "Admin")]
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

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] UserLoginDto userLoginDto)
    {
        try
        {
            var token = await _userService.LoginAsync(userLoginDto);
            return Ok(token);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{userId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserRents(int userId)
    {
        try
        {
            var count = await _userService.GetUserRents(userId);
            return Ok(count);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{userId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveRents(int userId)
    {
        try
        {
            var count = await _userService.GetActiveRents(userId);
            return Ok(count);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }




}
