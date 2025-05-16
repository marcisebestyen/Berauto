using Microsoft.AspNetCore.Mvc;
using Services.Services;
using Database.Dtos.CarDtos;

namespace Berauto.Controllers
{
    /// <summary>
    /// Autókkal kapcsolatos műveletek végrehajtására szolgáló végpontok.
    /// </summary>
    [ApiController]
    [Route("api/cars")]
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
        [HttpGet]
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
        [HttpGet("{carId:int}")]
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
        [HttpPost]
        public async Task<IActionResult> AddCar([FromBody] CarCreateDto createCarDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var newCar = await _carService.AddCarAsync(createCarDto);
            return CreatedAtAction(nameof(GetCarById), new { id = newCar.Id }, newCar);
        }

        /// <summary>
        /// Frissíti egy meglévő autó adatait a megadott azonosító alapján.
        /// </summary>
        /// <param name="carId">A frissítendő autó egyedi azonosítója.</param>
        /// <param name="updateCarDto">Az autó frissítéséhez szükséges adatok.</param>
        /// <response code="204">Az autó adatai sikeresen frissítve.</response>
        /// <response code="400">Érvénytelen bemeneti adatok.</response>
        /// <response code="404">A megadott azonosítóval nem található autó.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpPatch("{carId:int}")]
        public async Task<IActionResult> UpdateCar(int carId, [FromBody] CarUpdateDto updateCarDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                await _carService.UpdateCarAsync(carId, updateCarDto);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Törli a megadott azonosítójú autót.
        /// </summary>
        /// <param name="carId">A törlendő autó egyedi azonosítója.</param>
        /// <response code="204">Az autó sikeresen törölve.</response>
        /// <response code="404">A megadott azonosítóval nem található autó.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpDelete("{carId:int}")]
        public async Task<IActionResult> DeleteCar(int carId)
        {
            try
            {
                await _carService.DeleteCarAsync(carId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Frissíti egy autó kilométeróra-állását.
        /// A kérés törzsében egy nyers decimális számot vár (pl. 125000.50).
        /// </summary>
        /// <param name="carId">Az autó egyedi azonosítója.</param>
        /// <param name="newKilometers">Az új kilométeróra-állás (közvetlenül a kérés törzséből).</param>
        /// <response code="204">A kilométeróra-állás sikeresen frissítve.</response>
        /// <response code="400">Érvénytelen bemeneti adat (pl. nem szám).</response>
        /// <response code="404">A megadott azonosítóval nem található autó.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpPatch("{carId:int}/kilometers")]
        public async Task<IActionResult> UpdateCarKilometers(int carId, [FromBody] decimal newKilometers)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                await _carService.UpdateCarKilometersAsync(carId, newKilometers);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Beállítja egy autó állapotát (megfelelő állapotban van-e).
        /// A kérés törzsében egy nyers boolean értéket vár (pl. true vagy false).
        /// </summary>
        /// <param name="carId">Az autó egyedi azonosítója.</param>
        /// <param name="inProperCondition">Az új állapot (true vagy false, közvetlenül a kérés törzséből).</param>
        /// <response code="204">Az autó állapota sikeresen beállítva.</response>
        /// <response code="400">Érvénytelen bemeneti adat (pl. nem boolean).</response>
        /// <response code="404">A megadott azonosítóval nem található autó.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpPatch("{carId:int}/condition")]
        public async Task<IActionResult> SetCarCondition(int carId, [FromBody] bool inProperCondition)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                await _carService.SetCarConditionAsync(carId, inProperCondition);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
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
        public async Task<IActionResult> GetAvailableCars([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            if (startDate >= endDate)
            {
                return BadRequest("Start date must be before end date.");
            }
            var cars = await _carService.GetAvailableCarsAsync(startDate, endDate);
            return Ok(cars);
        }
    }
}