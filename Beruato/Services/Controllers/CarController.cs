using Microsoft.AspNetCore.Mvc;
using Services.Services;
using Database.Dtos.CarDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Database.Models;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Authorization;

namespace Berauto.Controllers
{
    /// <summary>
    /// Autókkal kapcsolatos műveletek végrehajtására szolgáló végpontok.
    /// </summary>
    [ApiController]
    [Route("api/cars")]
    [Authorize(Roles = "Admin")]
    public class CarsController : Controller
    {
        private readonly ICarService _carService;

        /// <summary>
        /// CarsController konstruktor.
        /// </summary>
        /// <param name="carService">Az autók üzleti logikáját kezelő szerviz.</param>
        public CarsController(ICarService carService)
        {
            _carService = carService ?? throw new ArgumentNullException(nameof(carService));
        }

        /// <summary>
        /// Lekérdezi az összes autót.
        /// </summary>
        /// <returns>Az összes autó listája.</returns>
        /// <response code="200">Sikeresen visszaadja az autók listáját. A válasz teste: IEnumerable&lt;CarDto&gt;</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpGet("get-all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllCars()
        {
            var cars = await _carService.GetAllCarsAsync();
            return Ok(cars);
        }

        /// <summary>
        /// Lekérdezi a megadott azonosítójú autót.
        /// </summary>
        /// <param name="carId">Az autó egyedi azonosítója.</param>
        /// <returns>A megadott azonosítójú autó.</returns>
        /// <response code="200">Sikeresen visszaadja a kért autót. A válasz teste: CarDto</response>
        /// <response code="404">A megadott azonosítóval nem található autó.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpGet("get/{carId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCarById(int carId)
        {
            var car = await _carService.GetCarByIdAsync(carId);
            if (car == null)
            {
                return NotFound($"Car with id {carId} not found.");
            }

            return Ok(car);
        }


        /// <summary>
        /// Új autót ad hozzá a rendszerhez.
        /// </summary>
        /// <param name="createCarDto">Az új autó létrehozásához szükséges adatok.</param>
        /// <returns>A létrehozott autó adatai.</returns>
        /// <response code="201">Az autó sikeresen létrehozva. A válasz tartalmazza a létrehozott autót (CarDto) a 'Location' fejléc mellett.</response>
        /// <response code="400">Érvénytelen bemeneti adatok.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpPost("create-car")]
        public async Task<IActionResult> AddCar([FromBody] CarCreateDto createCarDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var newCar = await _carService.AddCarAsync(createCarDto);
            return CreatedAtAction(nameof(GetCarById), new { carId = newCar.Id }, newCar);
        }

        /// <summary>
        /// Részlegesen frissíti egy meglévő autó adatait JSON Patch dokumentummal.
        /// </summary>
        /// <param name="carId">A frissítendő autó egyedi azonosítója.</param>
        /// <param name="patchDocument">A JSON Patch dokumentum, ami a módosításokat tartalmazza az autó entitáson.</param>
        /// <remarks>
        /// Példa JSON Patch kérésre:
        /// [
        ///   { "op": "replace", "path": "/licencePlate", "value": "NEW-123" },
        ///   { "op": "replace", "path": "/isAutomatic", "value": false }
        /// ]
        /// </remarks>
        /// <response code="204">Az autó adatai sikeresen frissítve.</response>
        /// <response code="400">Érvénytelen bemeneti adatok vagy hibás patch dokumentum.</response>
        /// <response code="404">A megadott azonosítóval nem található autó.</response>
        /// <response code="409">Konkurrens módosítási ütközés történt.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpPatch("update/{carId:int}")]
        public async Task<IActionResult> UpdateCar([FromRoute(Name = "carId")] int id,
            [FromBody] JsonPatchDocument<Car> patchDocument)
        {
            if (patchDocument == null)
            {
                return BadRequest("A patch dokumentum nem lehet null, vagy érvénytelen formátumú.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _carService.UpdateCarAsync(id, patchDocument, ModelState);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                if (ModelState.ErrorCount > 0)
                {
                    return BadRequest(ModelState);
                }

                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (DbUpdateConcurrencyException /* ex */)
            {
                return Conflict(
                    new { message = "Az adatokat időközben valaki más módosította. Kérjük, próbálja újra." });
            }
            catch (DbUpdateException /* ex */)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Hiba történt az adatok frissítése közben." });
            }
            catch (Exception /* ex */)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Váratlan hiba történt." });
            }
        }

        /// <summary>
        /// Törli a megadott azonosítójú autót.
        /// </summary>
        /// <param name="carId">A törlendő autó egyedi azonosítója.</param>
        /// <response code="204">Az autó sikeresen törölve.</response>
        /// <response code="404">A megadott azonosítóval nem található autó.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpDelete("delete/{carId:int}")]
        public async Task<IActionResult> DeleteCar(int carId)
        {
            try
            {
                await _carService.DeleteCarAsync(carId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Lekérdezi a megadott időintervallumban elérhető autókat.
        /// </summary>
        /// <param name="startDate">A keresési időintervallum kezdete (YYYY-MM-DDTHH:mm:ss formátumban).</param>
        /// <param name="endDate">A keresési időintervallum vége (YYYY-MM-DDTHH:mm:ss formátumban).</param>
        /// <returns>Az elérhető autók listája.</returns>
        /// <response code="200">Sikeresen visszaadja az elérhető autók listáját. A válasz teste: IEnumerable&lt;CarDto&gt;</response>
        /// <response code="400">Érvénytelen dátumformátum vagy időintervallum.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpGet("available")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailableCars([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            DateTime today = DateTime.Today; // A szerver mai napja, éjfél
            if (startDate < today)
            {
                return BadRequest("A kezdő dátum nem lehet korábbi a mai napnál.");
            }

            if (startDate >= endDate)
            {
                return BadRequest("Start date must be before end date.");
            }

            var cars = await _carService.GetAllCarsWithAvailabilityAsync(startDate, endDate);
            return Ok(cars);
        }
    }
}