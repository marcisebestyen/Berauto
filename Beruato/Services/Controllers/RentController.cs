using System.Security.Claims;
using Database.Dtos;
using Database.Dtos.RentDtos;
using Database.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.Services; 


namespace Services.Controllers 
{
    /// <summary>
    /// Kölcsönzésekkel (Rent) kapcsolatos műveletek végrehajtására szolgáló végpontok.
    /// </summary>
    [ApiController]
    [Route("api/Rent")]
    [AllowAnonymous]
    public class RentController : Controller 
    {
        private readonly IRentService _rentService;
        private readonly IUserService _userService;

        /// <summary>
        /// RentController konstruktor.
        /// </summary>
        /// <param name="rentService">A kölcsönzések üzleti logikáját kezelő szerviz.</param>
        public RentController(IRentService rentService,  IUserService userService)
        {
            _rentService = rentService ?? throw new ArgumentNullException(nameof(rentService));
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
        }

        /// <summary>
        /// Lekérdezi a kölcsönzéseket, opcionálisan szűrve állapot alapján.
        /// </summary>
        /// <param name="filter">A kölcsönzések szűrési állapota. Lehetséges értékek: All, Open, Closed, Running. Alapértelmezett: All.</param>
        /// <returns>A szűrt kölcsönzések listája.</returns>
        /// <response code="200">Sikeresen visszaadja a kölcsönzések listáját. A válasz teste: IEnumerable&lt;RentGetDto&gt;</response>
        /// <response code="400">Érvénytelen szűrőparaméter.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpGet]
        public async Task<IActionResult> GetRents(
        [FromQuery] RentStatusFilter filter = RentStatusFilter.All,
        [FromQuery] int? userId = null)
        {
            var rents = await _rentService.GetAllRentsAsync(filter, userId);
            return Ok(rents);
        }

        /// <summary>
        /// Lekérdezi a megadott azonosítójú kölcsönzést.
        /// </summary>
        /// <param name="id">A kölcsönzés egyedi azonosítója.</param>
        /// <returns>A megadott azonosítójú kölcsönzés.</returns>
        /// <response code="200">Sikeresen visszaadja a kért kölcsönzést. A válasz teste: RentGetDto</response>
        /// <response code="404">A megadott azonosítóval nem található kölcsönzés.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetRentById(int id)
        {
            var rent = await _rentService.GetRentByIdAsync(id);
            if (rent == null)
            {
                return NotFound($"Rent with id {id} not found.");
            }
            return Ok(rent);
        }

        /// <summary>
        /// Új kölcsönzési igényt ad hozzá a rendszerhez.
        /// </summary>
        /// <param name="createRentDto">Az új kölcsönzés létrehozásához szükséges adatok.</param>
        /// <returns>A létrehozott kölcsönzés adatai.</returns>
        /// <response code="201">A kölcsönzés sikeresen létrehozva. A válasz tartalmazza a létrehozott kölcsönzést (RentGetDto) a 'Location' fejléc mellett.</response>
        /// <response code="400">Érvénytelen bemeneti adatok (pl. hiányzó kötelező mezők, vagy a DTO null).</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpPost("createRent")]
        public async Task<IActionResult> AddRent([FromBody] RentCreateDto createRentDto)
        {
            if (createRentDto == null)
            {
                return BadRequest("A kölcsönzési adatok (request body) nem lehetnek üresek.");
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                createRentDto.PlannedStart = DateTime.SpecifyKind(createRentDto.PlannedStart, DateTimeKind.Utc);
                createRentDto.PlannedEnd = DateTime.SpecifyKind(createRentDto.PlannedEnd, DateTimeKind.Utc);

                var createdRent = await _rentService.AddRentAsync(createRentDto);
                return CreatedAtAction(nameof(GetRentById), new { id = createdRent.Id }, createdRent);
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Hiba történt a kölcsönzés feldolgozása közben.");
            }
        }

        [HttpPost("guest-create")]
        [ProducesResponseType(typeof(RentGetDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> AddGuestRent([FromBody] GuestRentCreateDto createGuestRentDto)
        {
            if (createGuestRentDto == null)
            {
                return BadRequest("A foglalási adatok nem lehetnek üresek.");
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                createGuestRentDto.PlannedStart = DateTime.SpecifyKind(createGuestRentDto.PlannedStart, DateTimeKind.Utc);
                createGuestRentDto.PlannedEnd = DateTime.SpecifyKind(createGuestRentDto.PlannedEnd, DateTimeKind.Utc);

                var createdRent = await _rentService.AddGuestRentAsync(createGuestRentDto);
                return CreatedAtAction(nameof(GetRentById), new { id = createdRent.Id }, createdRent);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Hiba történt a foglalás feldolgozása közben.");
            }
        }

        /// </summary>
        /// <param name="carId">Az autó azonosítója, amire a felhasználó várólistára szeretne feliratkozni.</param>
        /// <returns>A létrehozott várólista bejegyzés vagy információ a már létező bejegyzésről.</returns>
        /// <response code="200">Sikeresen feliratkozott a várólistára, vagy már rajta van.</response>
        /// <response code="400">Érvénytelen CarId, vagy az autó szabad (nincs szükség várólistára).</response>
        /// <response code="401">A felhasználó nincs bejelentkezve (az Authorize attribútum kezeli).</response>
        /// <response code="403">A felhasználó guest, és nem iratkozhat fel várólistára.</response>
        /// <response code="404">Az autó nem található.</response>
        /// <response code="500">Szerver oldali hiba történt.</response>
        [HttpPost("add-to-waiting-list/carId:int")]
        public async Task<IActionResult> AddToWaitingList(int carId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("A felhasználó nincs bejelentkezve.");
            }
            
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized("Felhasználói adatok nem találhatóak.");
            }

            if (!user.RegisteredUser)
            {
                return Forbid("Vendég felhasználók nem iratkozhatnak fel várólistára.");
            }

            var waitingListDto = new WaitingListCreateDto
            {
                CarId = carId,
                UserId = userId
            };

            try
            {
                var result = await _rentService.AddToWaitingListAsync(waitingListDto);

                if (result == null)
                {
                    return BadRequest("Az autó jelenleg szabad, nincs szükség várólistára. Kérjük, próbálja meg lefoglalni közvetlenül.");
                }
                else if (result.Status == Status.Active && result.NotifiedAt == null)
                {
                    return Ok(new
                    {
                        Message = "Sikeresen feliratkozott a várólistára.",
                        WaitingListId = result.Id,
                        CarId = result.CarId,
                        UserId = result.UserId,
                        QueuePosition = result.QueuePosition,
                        QueuedAt = result.QueuedAt,
                        Status = result.Status.ToString()
                    });
                }
                else
                {
                    return Ok(new
                    {
                        Message = "A felhasználó már várólistán van ehhez az autóhoz, vagy a bejegyzés más állapotban van.",
                        WaitingListId = result.Id,
                        CarId = result.CarId,
                        UserId = result.UserId,
                        QueuePosition = result.QueuePosition,
                        QueuedAt = result.QueuedAt,
                        Status = result.Status.ToString()
                    });
                }
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, $"Hiba történt a várólistára való feliratkozás során: {ex.Message}");
            }
        }
    }
}