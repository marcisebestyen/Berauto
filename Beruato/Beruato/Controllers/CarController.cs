using Database.Dtos;
using Database.Models;
using Microsoft.AspNetCore.Mvc;
using Services.Services;

namespace Beruato.Controllers
{
    [ApiController]
    [Route("[controller]/[action]")]
    public class CarController : ControllerBase
    {
        
        private readonly ICarServices _carServices;
        private readonly ILogger<CarController> _logger;

        public CarController(ICarServices carServices, ILogger<CarController> logger)
        {
            
            _carServices = carServices;
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        
       

        [HttpGet]
        public IActionResult ListCars()
        {
            _logger.LogInformation("ListCars method called");
            try
            {
                _carServices.ListCars();
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred in the ListCars method");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public IActionResult AddCar([FromBody] CarDto carDto)
        {
            _logger.LogInformation("AddCar method called");
            try
            {
                _carServices.AddCar(carDto);
                return Ok("Car added successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the car");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet]
        public IActionResult GetAvailableCars()
        {
            try
            {
                _carServices.GetAvailableCars();
                return Ok("Car added succesfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting available cars");
                throw;
            }
        }
    }
}
