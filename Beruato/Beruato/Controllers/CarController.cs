using Database.Dtos;
using Microsoft.AspNetCore.Authorization;
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
        [AllowAnonymous]
        public async Task<IActionResult> ListCars()
        {
            _logger.LogInformation("ListCars method called");
            try
            {
                var cars = await _carServices.ListCarsAsync();
                return Ok(cars);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred in the ListCars method");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> AddCar([FromBody] CreateCarDto carDto)
        {
            _logger.LogInformation("AddCar method called");
            try
            {
                await _carServices.AddCarAsync(carDto);
                return Ok("Car added successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the car");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailableCars()
        {
            try
            {
                var availableCars = await _carServices.GetAvailableCarsAsync();
                return Ok(availableCars);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting available cars");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateCar(int id, [FromBody] UpdateCarDto carUpdateDto)
        {
            _logger.LogInformation("UpdateCar method called");
            try
            {
                await _carServices.UpdateCarAsync(id, carUpdateDto);
                return Ok("Car availability updated successfully");
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid request for updating car availability");
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating car availability");
                return StatusCode(500, "Internal server error");
            }
        }


        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin, Director")]
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
