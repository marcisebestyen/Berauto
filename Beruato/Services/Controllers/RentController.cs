using Database.Dtos.RentDtos;
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

        /// <summary>
        /// RentController konstruktor.
        /// </summary>
        /// <param name="rentService">A kölcsönzések üzleti logikáját kezelő szerviz.</param>
        public RentController(IRentService rentService)
        {
            _rentService = rentService ?? throw new ArgumentNullException(nameof(rentService));
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


    }
}