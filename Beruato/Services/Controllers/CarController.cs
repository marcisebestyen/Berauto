using Microsoft.AspNetCore.Mvc;
using Services.Services;
using Database.Dtos.CarDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Database.Models;
using Microsoft.AspNetCore.JsonPatch;

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
        [HttpPatch("{carId:int}")]
        public async Task<IActionResult> UpdateCar([FromRoute(Name = "carId")] int id, [FromBody] JsonPatchDocument<Car> patchDocument)
        {
            // Ellenőrizzük, hogy maga a patchDocument objektum létrejött-e (nem null-e).
            // Ha a kliens pl. üres body-t küld, vagy nem valid JSON Patch formátumot,
            // a patchDocument null lehet, vagy a ModelState már itt tartalmazhat hibát.
            if (patchDocument == null)
            {
                return BadRequest("A patch dokumentum nem lehet null, vagy érvénytelen formátumú.");
            }

            // Az alap ModelState validáció (pl. ha a JSON deszerializáció során hiba történt)
            // Mielőtt a service-t hívnánk, érdemes lehet ellenőrizni.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Hívjuk a service metódust, átadva a controller saját ModelState objektumát.
                // A service metódus ebbe fogja beleírni a patchDocument.ApplyTo() során keletkező hibákat.
                await _carService.UpdateCarAsync(id, patchDocument, ModelState);



                return NoContent(); // Sikeres frissítés
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex) // Elkapja a service-ből dobott hibát, ha a ModelState érvénytelen lett a patch miatt
            {
                // Ha az ArgumentException azért jött, mert a ModelState hibás (az ApplyTo miatt),
                // akkor a ModelState itt már tartalmazza a részletes hibákat.
                if (ModelState.ErrorCount > 0) // Győződjünk meg róla, hogy tényleg a ModelState miatt van
                {
                    return BadRequest(ModelState);
                }
                return BadRequest(new { message = ex.Message }); // Általánosabb BadRequest, ha a ModelState üres
            }
            catch (InvalidOperationException ex) // Egyéb, üzleti logikai hibák a service-ből (pl. a te rendszám ellenőrzésed)
            {
                // Az InvalidOperationException gyakran 409 Conflict vagy 400 BadRequest.
                // A rendszám ütközés inkább 409 Conflict.
                return Conflict(new { message = ex.Message });
            }
            catch (DbUpdateConcurrencyException /* ex */)
            {
                // Ide logolhatnánk az ex-et
                return Conflict(new { message = "Az adatokat időközben valaki más módosította. Kérjük, próbálja újra." });
            }
            catch (DbUpdateException /* ex */)
            {
                // Ide logolhatnánk az ex-et
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Hiba történt az adatok frissítése közben." });
            }
            catch (Exception /* ex */) // Egyéb, nem várt hibákra
            {
                // Ide logolhatnánk az ex-et
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