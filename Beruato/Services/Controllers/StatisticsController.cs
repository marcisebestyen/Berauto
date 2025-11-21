using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Services;

namespace Services.Controllers
{
    /// <summary>
    /// Statisztikai adatok és kimutatások lekérdezésére szolgáló végpontok.
    /// Csak adminisztrátori jogosultsággal érhető el.
    /// </summary>
    [ApiController]
    [Route("api/statistics")]
    [Authorize(Roles = "Admin")] // Szigorúan csak Admin!
    public class StatisticsController : Controller
    {

        private readonly IStatisticsService _statisticsService;

        public StatisticsController(IStatisticsService statisticsService)
        {
            _statisticsService = statisticsService;
        }

        /// <summary>
        /// Lekérdezi az adminisztrátori dashboardhoz szükséges összesített statisztikai adatot.
        /// </summary>
        /// <returns>Egy DashboardStatisticsDto objektumot, ami tartalmazza a kimutatásokat.</returns>
        /// <response code="200">Sikeresen visszaadja a statisztikákat.</response>
        /// <response code="401">A felhasználó nincs bejelentkezve.</response>
        /// <response code="403">A felhasználó nem Admin.</response>
        /// <response code="500">Szerver oldali hiba történt az adatok gyűjtése közben.</response>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStatistics()
        {
            try
            {
                var stats = await _statisticsService.GetDashboardStatisticsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                // Itt érdemes logolni a hibát (ex)
                return StatusCode(500, "Hiba történt a statisztikák lekérdezése során.");
            }
        }
    }
}