using Microsoft.AspNetCore.Mvc;
using Services.Services; // Ensure this points to the correct namespace for IStaffService
using Services.Services.Services.Services; // This looks like a nested namespace, adjust if needed for your project structure
using Database.Dtos.RentDtos; // Assuming RentGetDto is here
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security.Claims;

namespace Services.Controllers
{
    /// <summary>
    /// Végpontok a személyzet által végzett bérléssel kapcsolatos műveletek kezelésére.
    /// (Endpoints for managing staff-related operations concerning rentals.)
    /// </summary>
    [ApiController]
    [Route("api/Staff")]
    public class StaffController : Controller
    {
        private readonly IStaffService _staffService;

        /// <summary>
        /// A StaffController új példányának inicializálása.
        /// (Initializes a new instance of the StaffController.)
        /// </summary>
        /// <param name="staffService">A bérlésekkel kapcsolatos személyzeti üzleti logikát kezelő szolgáltatás.</param>
        /// (The service handling staff-related business logic for rentals.)
        public StaffController(IStaffService staffService)
        {
            _staffService = staffService ?? throw new ArgumentNullException(nameof(staffService));
        }

        /// <summary>
        /// Egy bérlés jóváhagyásának rögzítése egy adott személyzeti tag által.
        /// (Records the approval of a rental by a specific staff member.)
        /// </summary>
        /// <param name="staffId">A jóváhagyó személyzeti tag egyedi azonosítója.</param>
        /// (The unique identifier of the staff member approving the rent.)
        /// <param name="rentId">A jóváhagyandó bérlés egyedi azonosítója.</param>
        /// (The unique identifier of the rent to be approved.)
        /// <returns>A jóváhagyott bérlés adatait tartalmazó választ.</returns>
        /// (The response containing the data of the approved rental.)
        /// <response code="200">Sikeresen jóváhagyta a bérlést. A válasz teste: RentGetDto.</response>
        /// (Successfully approved the rental. Response body: RentGetDto.)
        /// <response code="404">A megadott azonosítóval nem található bérlés, vagy a felhasználó nem személyzeti tag.</response>
        /// (Rental not found with the given ID, or the user is not a staff member.)
        [HttpPost("approve")]
        public async Task<IActionResult> Approve(int rentId)
        {
            var staffId = GetCurrentStaffIdFromToken();
            try
            {
                var rent = await _staffService.ApprovedBy(staffId, rentId);
                return Ok(rent);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Egy bérlés kiadásának rögzítése egy adott személyzeti tag által, beleértve az aktuális kezdési időt és a kezdő kilométeróra-állást.
        /// (Records the issuance of a rental by a specific staff member, including the actual start time and starting odometer reading.)
        /// </summary>
        /// <param name="staffId">A kiadó személyzeti tag egyedi azonosítója.</param>
        /// (The unique identifier of the staff member issuing the car.)
        /// <param name="rentId">A kiadandó bérlés egyedi azonosítója.</param>
        /// (The unique identifier of the rent being issued.)
        /// <param name="actualStart">A gépkocsi tényleges kiadásának dátuma és időpontja.</param>
        /// (The actual date and time when the car was issued.)
        /// <param name="startingKilometer">A gépkocsi kilométeróra-állása a kiadáskor.</param>
        /// (The odometer reading of the car at the time of issuance.)
        /// <returns>A frissített bérlés adatait tartalmazó választ.</returns>
        /// (The response containing the data of the updated rental.)
        /// <response code="200">Sikeresen frissítette a bérlést. A válasz teste: RentGetDto.</response>
        /// (Successfully updated the rental. Response body: RentGetDto.)
        /// <response code="404">A megadott azonosítóval nem található bérlés, vagy a felhasználó nem személyzeti tag.</response>
        /// (Rental not found with the given ID, or the user is not a staff member.)
        [HttpPost("hand_over")]
        public async Task<IActionResult> HandOver(int rentId, DateTime actualStart)
        {
            var staffId = GetCurrentStaffIdFromToken();
            try
            {
                var rent = await _staffService.IssuedBy(staffId, rentId, actualStart);
                return Ok(rent);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Egy bérlés visszavételének rögzítése egy adott személyzeti tag által, beleértve az aktuális befejezési időt és a befejező kilométeróra-állást.
        /// (Records the return of a rental by a specific staff member, including the actual end time and ending odometer reading.)
        /// </summary>
        /// <param name="staffId">A visszavevő személyzeti tag egyedi azonosítója.</param>
        /// (The unique identifier of the staff member taking back the car.)
        /// <param name="rentId">A lezárandó bérlés egyedi azonosítója.</param>
        /// (The unique identifier of the rent being closed.)
        /// <param name="actualEnd">A gépkocsi tényleges visszavételének dátuma és időpontja.</param>
        /// (The actual date and time when the car was taken back.)
        /// <param name="endingKilometer">A gépkocsi kilométeróra-állása a visszavételkor.</param>
        /// (The odometer reading of the car at the time of return.)
        /// <returns>A frissített bérlés adatait tartalmazó választ.</returns>
        /// (The response containing the data of the updated rental.)
        /// <response code="200">Sikeresen frissítette a bérlést. A válasz teste: RentGetDto.</response>
        /// (Successfully updated the rental. Response body: RentGetDto.)
        /// <response code="404">A megadott azonosítóval nem található bérlés, vagy a felhasználó nem személyzeti tag.</response>
        /// (Rental not found with the given ID, or the user is not a staff member.)
        [HttpPost("take_back")]
        public async Task<IActionResult> TakeBack(int rentId, DateTime actualEnd, decimal endingKilometer)
        {

            var staffId = GetCurrentStaffIdFromToken();

            try
            {
                var rent = await _staffService.TakenBackBy(staffId, rentId, actualEnd, endingKilometer);
                return Ok(rent);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }


        private int GetCurrentStaffIdFromToken() // Hasonlóan a UserControllerben lévőhöz
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier); // Vagy egy specifikus StaffID claim
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                // Logolás és hiba
                throw new UnauthorizedAccessException("Személyzeti azonosító nem található a tokenben.");
            }
            // Itt még ellenőrizhetnéd, hogy ez a userId valóban Staff szerepkörű-e,
            // bár az [Authorize(Roles = "Staff")] ezt már megteszi.
            return userId;
        }
    }
}