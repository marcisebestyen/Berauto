using Database.Dtos.RentDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.Services; // Feltételezve, hogy az IRentService és RentStatusFilter itt van, vagy a usingok megfelelőek


namespace Services.Controllers // A megadott névtér alapján
{
    /// <summary>
    /// Kölcsönzésekkel (Rent) kapcsolatos műveletek végrehajtására szolgáló végpontok.
    /// </summary>
    [ApiController]
    [Route("api/Rent")]
    public class RentController : Controller // API Controllereknél ControllerBase is gyakori
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
            if (createRentDto == null) // Ezt az [ApiController] és a model binder is kezeli (400-at ad, ha a body üres és a paraméter nem nullable)
            {
                return BadRequest("A kölcsönzési adatok (request body) nem lehetnek üresek.");
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var createdRent = await _rentService.AddRentAsync(createRentDto);
                return CreatedAtAction(nameof(GetRentById), new { id = createdRent.Id }, createdRent);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Hiba történt a kölcsönzés feldolgozása közben.");
            }
        }
        [HttpPost("guest-create")] // Új végpont
        [ProducesResponseType(typeof(RentGetDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> AddGuestRent([FromBody] GuestRentCreateDto createGuestRentDto)
        {
            if (createGuestRentDto == null)
            {
                return BadRequest("A foglalási adatok nem lehetnek üresek.");
            }
            if (!ModelState.IsValid) // Ellenőrzi a GuestRentCreateDto-n lévő DataAnnotation-öket
            {
                return BadRequest(ModelState);
            }

            try
            {
                var createdRent = await _rentService.AddGuestRentAsync(createGuestRentDto);
                // A GetRentById action-t használjuk a Location header generálásához
                return CreatedAtAction(nameof(GetRentById), new { id = createdRent.Id }, createdRent);
            }
            catch (ArgumentException ex) // Pl. ha a vendég adatok hiányosak a service-ben
            {
               
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
               
                return StatusCode(StatusCodes.Status500InternalServerError, "Hiba történt a foglalás feldolgozása közben.");
            }
        }
        
    }
}