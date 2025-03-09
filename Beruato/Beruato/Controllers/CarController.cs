using Database.Dtos;
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
                _carServices.ListCarsAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred in the ListCars method");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public IActionResult AddCar([FromBody] CreateCarDto carDto)
        {
            _logger.LogInformation("AddCar method called");
            try
            {
                _carServices.AddCarAsync(carDto);
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
                _carServices.GetAvailableCarsAsync();
                return Ok("Car added succesfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting available cars");
                throw;
            }
        }
        
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCar(int id, [FromBody] UpdateCarDto carUpdateDto)
        {
            _logger.LogInformation("UpdateCar method called");
            try
            {
                await _carServices.UpdateCarAsync(id, carUpdateDto);
                return Ok("Car updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating the car");
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveCar(int id)
        {
            _logger.LogInformation("RemoveCar method called");
            try
            {
                await _carServices.RemoveCarAsync(id);
                return Ok("Car removed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while removing the car");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
