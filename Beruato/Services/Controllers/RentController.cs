using Database.Dtos.RentDtos;
using Microsoft.AspNetCore.Mvc;
using Services.Services;


namespace Services.Controllers
{
    [ApiController]
    [Route("api/Rent")]
    public class RentController : Controller
    {
        private readonly IRentService _rentService;
        public RentController(IRentService rentService)
        {
            _rentService = rentService ?? throw new ArgumentNullException(nameof(rentService));
        }
        
        [HttpGet]
        public async Task<IActionResult> GetRents([FromQuery] RentStatusFilter filter = RentStatusFilter.All)
        {
            var rents = await _rentService.GetAllRentsAsync(filter);
            return Ok(rents);
        }
        
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
        [HttpPost]
        public async Task<IActionResult> AddRent([FromBody] RentCreateDto createRentDto)
        {
            if (createRentDto == null)
            {
                return BadRequest("Invalid rent data.");
            }
            var createdRent = await _rentService.AddRentAsync(createRentDto);
            return CreatedAtAction(nameof(GetRentById), new { id = createdRent.Id }, createdRent);
        }
    }
}
