using Microsoft.AspNetCore.Mvc;
using Services.Services;
using Services.Services.Services.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Controllers
{
    [ApiController]
    [Route("api/Staff")]
    public class StaffController : Controller
    {
        private readonly IStaffService _staffService;
        public StaffController(IStaffService staffService)
        {
            _staffService = staffService ?? throw new ArgumentNullException(nameof(staffService));
        }

        [HttpPatch("approved-by")]

        public async Task<IActionResult> ApprovedBy(int staffId, int rentId)
        {
            var rent = await _staffService.ApprovedBy(staffId, rentId);
            if (rent == null)
            {
                return NotFound($"Rent with id {rentId} not found.");
            }
            return Ok(rent);
        }
        [HttpPatch("update-IssuedBy")]
        public async Task<IActionResult> IssuedBy(int staffId, int rentId, DateTime actualStart, decimal startingKilometer)
        {
            var rent = await _staffService.IssuedBy(staffId, rentId, actualStart, startingKilometer);
            if (rent == null)
            {
                return NotFound($"Rent with id {rentId} not found.");
            }
            return Ok(rent);
        }
        [HttpPatch("update-TakenBackBy")]
        public async Task<IActionResult> TakenBackBy(int staffId, int rentId, DateTime actualEnd, decimal endingKilometer)
        {
            var rent = await _staffService.TakenBackBy(staffId, rentId, actualEnd, endingKilometer);
            if (rent == null)
            {
                return NotFound($"Rent with id {rentId} not found.");
            }
            return Ok(rent);
        }
    }
}
