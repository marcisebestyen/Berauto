using Database.Dtos;
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
        public async Task<IActionResult> ReturnRent([FromBody] int rentId)
        {
            try
            {
                var rent = await _berautoRentService.ReturnRent(rentId);
                return Ok(rent);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet]
        public async Task<IActionResult> ListAllRents()
        {
            var result = await _berautoRentService.ListAllRents();
            return Ok(result);
        }

        [HttpPut]
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
