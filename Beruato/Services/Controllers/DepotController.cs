using Microsoft.AspNetCore.Mvc;
using Services.Services;
using Database.Dtos.DepotDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Database.Models;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Authorization;

namespace Berauto.Controllers
{
    /// <summary>
    /// Telephelyekkel kapcsolatos műveletek végrehajtására szolgáló végpontok.
    /// </summary>
    [ApiController]
    [Route("api/depots")]
    [Authorize(Roles = "Admin")]
    public class DepotsController : Controller
    {
        private readonly IDepotService _depotService;

        /// <summary>
        /// DepotsController konstruktor.
        /// </summary>
        /// <param name="depotService">A telephelyek üzleti logikáját kezelő szerviz.</param>
        public DepotsController(IDepotService depotService)
        {
            _depotService = depotService ?? throw new ArgumentNullException(nameof(depotService));
        }

        /// <summary>
        /// Lekérdezi az összes telephelyet.
        /// </summary>
        /// <returns>Az összes telephely listája.</returns>
        /// <response code="200">Sikeresen visszaadja a telephelyek listáját. A válasz teste: IEnumerable&lt;DepotGetDto&gt;</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpGet("get-all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllDepots()
        {
            var depots = await _depotService.GetAllDepotsAsync();
            return Ok(depots);
        }

        /// <summary>
        /// Lekérdezi a megadott azonosítójú telephelyet.
        /// </summary>
        /// <param name="depotId">A telephely egyedi azonosítója.</param>
        /// <returns>A megadott azonosítójú telephely.</returns>
        /// <response code="200">Sikeresen visszaadja a kért telephelyet. A válasz teste: DepotGetDto</response>
        /// <response code="404">A megadott azonosítóval nem található telephely.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpGet("get/{depotId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepotById(int depotId)
        {
            var depot = await _depotService.GetDepotByIdAsync(depotId);
            if (depot == null)
            {
                return NotFound($"Depot with id {depotId} not found.");
            }

            return Ok(depot);
        }

        /// <summary>
        /// Új telephelyet ad hozzá a rendszerhez.
        /// </summary>
        /// <param name="createDepotDto">Az új telephely létrehozásához szükséges adatok.</param>
        /// <returns>A létrehozott telephely adatai.</returns>
        /// <response code="201">A telephely sikeresen létrehozva. A válasz tartalmazza a létrehozott telephelyet (DepotGetDto).</response>
        /// <response code="400">Érvénytelen bemeneti adatok.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpPost("create-depot")]
        public async Task<IActionResult> AddDepot([FromBody] DepotCreateDto createDepotDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var newDepot = await _depotService.AddDepotAsync(createDepotDto);
            return CreatedAtAction(nameof(GetDepotById), new { depotId = newDepot.Id }, newDepot);
        }

        /// <summary>
        /// Részlegesen frissíti egy meglévő telephely adatait JSON Patch dokumentummal.
        /// </summary>
        /// <param name="depotId">A frissítendő telephely egyedi azonosítója.</param>
        /// <param name="patchDocument">A JSON Patch dokumentum, ami a módosításokat tartalmazza a telephely entitáson.</param>
        /// <remarks>
        /// Példa JSON Patch kérésre:
        /// [
        ///   { "op": "replace", "path": "/name", "value": "Központi Telephely" },
        ///   { "op": "replace", "path": "/city", "value": "Budapest" }
        /// ]
        /// </remarks>
        /// <response code="204">A telephely adatai sikeresen frissítve.</response>
        /// <response code="400">Érvénytelen bemeneti adatok vagy hibás patch dokumentum.</response>
        /// <response code="404">A megadott azonosítóval nem található telephely.</response>
        /// <response code="409">Konkurrens módosítási ütközés történt.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpPatch("update/{depotId:int}")]
        public async Task<IActionResult> UpdateDepot([FromRoute(Name = "depotId")] int id,
            [FromBody] JsonPatchDocument<Depot> patchDocument)
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
                await _depotService.UpdateDepotAsync(id, patchDocument, ModelState);
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
        /// Törli a megadott azonosítójú telephelyet.
        /// </summary>
        /// <param name="depotId">A törlendő telephely egyedi azonosítója.</param>
        /// <response code="204">A telephely sikeresen törölve.</response>
        /// <response code="404">A megadott azonosítóval nem található telephely.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpDelete("delete/{depotId:int}")]
        public async Task<IActionResult> DeleteDepot(int depotId)
        {
            try
            {
                await _depotService.DeleteDepotAsync(depotId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                // Például ha a telephelyhez autók vannak rendelve és nem törölhető
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
            }
        }
    }
}