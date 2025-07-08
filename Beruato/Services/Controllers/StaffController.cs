using Microsoft.AspNetCore.Mvc;
using Services.Services; // For IStaffService
using Database.Dtos.RentDtos; // For RentGetDto
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Services.Database.Dtos;

namespace Services.Controllers
{
    /// <summary>
    /// Végpontok a személyzet által végzett bérléssel kapcsolatos műveletek kezelésére.
    /// (Endpoints for managing staff-related operations concerning rentals.)
    /// </summary>
    [ApiController]
    [Route("api/staff")]
    [Authorize(Roles = "Staff,Admin")]
    public class StaffController : Controller
    {
        private readonly IStaffService _staffService;

        /// <summary>
        /// A StaffController új példányának inicializálása.
        /// (Initializes a new instance of the StaffController.)
        /// </summary>
        /// <param name="staffService">A bérlésekkel kapcsolatos személyzeti üzleti logikát kezelő szolgáltatás.</param>
        public StaffController(IStaffService staffService)
        {
            _staffService = staffService ?? throw new ArgumentNullException(nameof(staffService));
        }

        private int GetCurrentStaffIdFromToken()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Személyzeti azonosító nem található vagy érvénytelen a tokenben.");
            }
            return userId;
        }

        /// <summary>
        /// Egy bérlés jóváhagyásának rögzítése a bejelentkezett személyzeti tag által.
        /// (Records the approval of a rental by the logged-in staff member.)
        /// </summary>
        /// <param name="rentId">A jóváhagyandó bérlés egyedi azonosítója.</param>
        /// <returns>A jóváhagyott bérlés adatait tartalmazó választ.</returns>
        /// <response code="200">Sikeresen jóváhagyta a bérlést. A válasz teste: RentGetDto.</response>
        /// <response code="401">A felhasználó nincs authentikálva, vagy a tokenből hiányzik a személyzeti azonosító.</response>
        /// <response code="403">A felhasználónak nincs joga végrehajtani ezt a műveletet.</response>
        /// <response code="404">A megadott azonosítóval nem található bérlés, vagy a személyzeti tag nem található/jogosult.</response>
        [HttpPost("approve")]
        public async Task<IActionResult> Approve(int rentId)
        {
            try
            {
                var staffId = GetCurrentStaffIdFromToken();
                var rentDto = await _staffService.ApprovedBy(staffId, rentId);
                return Ok(rentDto);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception ex
                return StatusCode(500, new { message = "Váratlan hiba történt a jóváhagyás során." });
            }
        }

        /// <summary>
        /// Egy bérlés kiadásának rögzítése a bejelentkezett személyzeti tag által.
        /// (Records the issuance of a rental by the logged-in staff member.)
        /// </summary>
        /// <param name="rentId">A kiadandó bérlés egyedi azonosítója.</param>
        /// <param name="request">A kiadás részleteit tartalmazó adatok (aktuális kezdés).</param>
        /// <returns>A frissített bérlés adatait tartalmazó választ.</returns>
        /// <response code="200">Sikeresen frissítette a bérlést. A válasz teste: RentGetDto.</response>
        /// <response code="400">Érvénytelen művelet (pl. bérlés nincs jóváhagyva).</response>
        /// <response code="401">A felhasználó nincs authentikálva, vagy a tokenből hiányzik a személyzeti azonosító.</response>
        /// <response code="403">A felhasználónak nincs joga végrehajtani ezt a műveletet.</response>
        /// <response code="404">A megadott azonosítóval nem található bérlés, vagy a személyzeti tag nem található/jogosult.</response>
        [HttpPost("hand_over")]
        public async Task<IActionResult> HandOver(int rentId, [FromBody] HandOverRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "A kiadási adatok nem lehetnek üresek." });
            }

            try
            {
                var staffId = GetCurrentStaffIdFromToken();

                var actualStartUtc = DateTime.SpecifyKind(request.ActualStart, DateTimeKind.Utc);

                var rentDto = await _staffService.IssuedBy(staffId, rentId, actualStartUtc);
                return Ok(rentDto);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Váratlan hiba történt a kiadás során." });
            }
        }


        /// <summary>
        /// Egy bérlés visszavételének rögzítése a bejelentkezett személyzeti tag által.
        /// (Records the return of a rental by the logged-in staff member.)
        /// </summary>
        /// <param name="rentId">A lezárandó bérlés egyedi azonosítója.</param>
        /// <param name="request">A visszavétel részleteit tartalmazó adatok (aktuális vég, km állás).</param>
        /// <returns>A frissített bérlés adatait tartalmazó választ.</returns>
        /// <response code="200">Sikeresen frissítette a bérlést. A válasz teste: RentGetDto.</response>
        /// <response code="400">Érvénytelen művelet (pl. bérlés nincs kiadva, km állás hibás).</response>
        /// <response code="401">A felhasználó nincs authentikálva, vagy a tokenből hiányzik a személyzeti azonosító.</response>
        /// <response code="403">A felhasználónak nincs joga végrehajtani ezt a műveletet.</response>
        /// <response code="404">A megadott azonosítóval nem található bérlés, vagy a személyzeti tag nem található/jogosult.</response>
        [HttpPost("take_back")]
        public async Task<IActionResult> TakeBack(int rentId, [FromBody] TakeBackRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "A visszavételi adatok nem lehetnek üresek." });
            }

            try
            {
                var staffId = GetCurrentStaffIdFromToken();

                var actualEndUtc = DateTime.SpecifyKind(request.ActualEnd, DateTimeKind.Utc);

                var rentDto = await _staffService.TakenBackBy(staffId, rentId, actualEndUtc, request.EndingKilometer);
                return Ok(rentDto);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Váratlan hiba történt a visszavétel során." });
            }
        }


        /// <summary>
        /// Egy bérlési igény elutasítása (törlése) a bejelentkezett személyzeti tag által.
        /// (Rejects (deletes) a rental request by the logged-in staff member.)
        /// </summary>
        /// <param name="rentId">Az elutasítandó bérlés egyedi azonosítója.</param>
        /// <param name="request">Az elutasítás opcionális indokát tartalmazó adatok.</param>
        /// <returns>Sikeres művelet esetén üres válasz, egyébként hibaüzenet.</returns>
        /// <response code="200">A bérlési igény sikeresen elutasítva.</response>
        /// <response code="400">Érvénytelen kérés vagy a művelet nem hajtható végre (pl. már elkezdődött bérlés).</response>
        /// <response code="401">A felhasználó nincs authentikálva, vagy a tokenből hiányzik a személyzeti azonosító.</response>
        /// <response code="403">A felhasználónak nincs joga végrehajtani ezt a műveletet.</response>
        /// <response code="404">A megadott azonosítóval nem található bérlés vagy személyzeti tag.</response>
        [HttpPost("reject")]
        public async Task<IActionResult> Reject(int rentId, [FromBody] RejectRentRequestDto request)
        {
            try
            {
                var staffId = GetCurrentStaffIdFromToken();
                var result = await _staffService.RejectRentAsync(staffId, rentId, request?.Reason);

                if (!result.Succeeded)
                {
                    var firstError = result.Errors?.FirstOrDefault() ?? "Ismeretlen hiba történt az elutasítás során.";
                    if (firstError.Contains("not found", StringComparison.OrdinalIgnoreCase) || firstError.Contains("nem található", StringComparison.OrdinalIgnoreCase))
                    {
                        return NotFound(new { message = firstError });
                    }
                    if (firstError.Contains("már elkezdődött", StringComparison.OrdinalIgnoreCase) ||
                        firstError.Contains("már jóvá lett hagyva", StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(new { message = firstError });
                    }
                    return BadRequest(new { message = firstError });
                }
                return Ok(new { message = "A bérlési igény sikeresen elutasítva." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Váratlan hiba történt az elutasítás során." });
            }
        }
    }
}