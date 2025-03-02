using Microsoft.AspNetCore.Mvc;
using Services.Services;
using Microsoft.Extensions.Logging;
using Database.Models;

namespace Beruato.Controllers
{
    [ApiController]
    [Route("[controller]/[action]")]
    public class BerautoController : ControllerBase
    {
        private readonly IBerautoService _berautoService;
        private readonly ICarServices _carServices;
        private readonly ILogger<BerautoController> _logger;

        public BerautoController(IBerautoService berautoService, ICarServices carServices, ILogger<BerautoController> logger)
        {
            _berautoService = berautoService;
            _carServices = carServices;
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        public IActionResult List()
        {
            _logger.LogInformation("List method called");
            var result = _berautoService.List();
            return Ok(result);
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
        public void AddCar(RequiredLicence licence, string brand, string model,
            string licencePlate, bool haveValidVignette, decimal price, int engineSize, int horsePower,
            int seats, FuelType fuelType, bool isAutomaticTransmission, double trunk)
        {
            try
            {
                _carServices.AddCar(licence,brand, model, licencePlate, haveValidVignette, price, engineSize, horsePower, seats, fuelType, isAutomaticTransmission, trunk);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding a car");
                throw;
            }
        }
        [HttpGet]
        public void GetAvailableCars()
        {
            try
            {
                _carServices.GetAvailableCars();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting available cars");
                throw;
            }
        }
        
        [HttpPut]
        public IActionResult UpdateCar(int id, bool? isAvailable, RequiredLicence? licence, string brand, string model,
            string licencePlate, bool? haveValidVignette, decimal? price, int? engineSize, int? horsePower,
            int? seats, FuelType? fuelType, bool? isAutomaticTransmission, double? trunk)
        {
            _logger.LogInformation("UpdateCar method called");
            try
            {
                _carServices.UpdateCar(id, isAvailable, licence, brand, model, licencePlate, haveValidVignette, price,
                    engineSize, horsePower, seats, fuelType, isAutomaticTransmission, trunk);
                return Ok("Car updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating the car");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
