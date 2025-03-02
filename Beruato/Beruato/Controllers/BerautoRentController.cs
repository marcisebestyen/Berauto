using Microsoft.AspNetCore.Mvc;
using Services.Services;

namespace Beruato.Controllers
{

    [ApiController]
    [Route("[controller]/[action]")]
    public class BerautoRentController : ControllerBase
    {

        private readonly IRentService _berautoRentService;
        public BerautoRentController(IRentService berautoRentService)
        {
            _berautoRentService = berautoRentService;
        }
        [HttpPost]
        public IActionResult AddRent(int carId, int userId,int administratorId, DateTime startDate, DateTime endDate)
        {
            try
            {
                _berautoRentService.AddRent(carId, userId,administratorId, startDate, endDate);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPost]
        public IActionResult ReturnCar(int rentId)
        {
            try
            {
                _berautoRentService.ReturnRent(rentId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet]
        public IActionResult GetRents()
        {
            var result = _berautoRentService.GetRents();
            return Ok(result);
        }
    }
}
