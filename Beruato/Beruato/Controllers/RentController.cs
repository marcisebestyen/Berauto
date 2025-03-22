using Database.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Services;


namespace Beruato.Controllers
{

    [ApiController]
    [Route("[controller]/[action]")]
    public class RentController : ControllerBase
    {

        private readonly IRentService _berautoRentService;
        public RentController(IRentService berautoRentService)
        {
            _berautoRentService = berautoRentService;
        }


        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> CreateRent([FromBody] CreateRentDto createRentDto)
        {
            try
            {
                var rent = await _berautoRentService.CreateRent(createRentDto);
                return Ok(rent);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpPost]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> GetRent([FromBody] int rentId)
        {
            try
            {
                var rent = await _berautoRentService.GetRent(rentId);
                return Ok(rent);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> GetAllRent()
        {
            var result = await _berautoRentService.GetAllRent();
            return Ok(result);
        }

        [HttpPut]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> UpdateRent(UpdateRentDto updateRentDto, int rentId)
        {
            try
            {
                var rent = await _berautoRentService.UpdateRent(updateRentDto, rentId);
                return Ok(rent);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> DeleteRent([FromBody] int rentId)
        {
            try
            {
                var rent = await _berautoRentService.DeleteRent(rentId);
                return Ok(rent);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> ChangeFinished([FromBody] int rentId)
        {
            try
            {
                var rent = await _berautoRentService.ChangeFinished(rentId);
                return Ok(rent);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
