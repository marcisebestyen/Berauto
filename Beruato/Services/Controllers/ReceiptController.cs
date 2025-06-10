using Database.Dtos.ReceiptDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Services.Services;
using System.Security.Claims;

namespace Services.Controllers;

[ApiController]
[Route("api/receipts")]
public class ReceiptController : Controller
{
    private readonly IReceiptService _receiptService;
    private readonly ILogger<ReceiptController> _logger;

    public ReceiptController(IReceiptService receiptService, ILogger<ReceiptController> logger)
    {
        _receiptService = receiptService ?? throw new ArgumentNullException(nameof(receiptService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Lekérdezi egy számla adatait az azonosítója alapján.
    /// </summary>
    /// <param name="receiptId">A lekérdezendő számla azonosítója.</param>
    /// <returns>A számla adatai (ReceiptGetDto), ha létezik.</returns>
    [HttpGet("{receiptId}")]
    [Authorize(Roles = "Staff,Admin")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ReceiptGetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetReceipt(int receiptId)
    {
        var receiptDto = await _receiptService.GetReceiptByIdAsync(receiptId);

        if (receiptDto == null)
        {
            _logger?.LogInformation("Receipt not found for receipt ID: {RequestedReceiptId}", receiptId);
            return NotFound(new { Message = $"A(z) {receiptId} azonosítójú bérlés nem található." });
        }
        
        return Ok(receiptDto);
    }

    /// <summary>
    /// Létrehoz egy új számlát a megadott adatok alapján.
    /// </summary>
    /// <param name="createDto">A létrehozandó számla adatait tartalmazó objektum (ReceiptCreateDto).</param>
    /// <returns>
    /// HTTP 201 Created státuszkód és a létrehozott számla adatai (ReceiptGetDto), ha a létrehozás sikeres.
    /// HTTP 400 BadRequest státuszkód, ha a bemeneti adatok érvénytelenek vagy üzleti logikai hiba lép fel.
    /// HTTP 500 InternalServerError státuszkód váratlan szerverhiba esetén.
    /// </returns>
    [HttpPost ("Create")]
    [Authorize(Roles = "Staff,Admin")]
    [ProducesResponseType(typeof(ReceiptGetDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateReceipt([FromBody] ReceiptCreateDto createDto)
    {
        var result = await _receiptService.CreateReceiptAsync(createDto);

        if (!result.Succeeded)
        {
            return BadRequest(new { Errors = result.Errors });
        }
        
        return CreatedAtAction(nameof(GetReceipt), new { receiptId = result.Resource.Id }, result.Resource);
    }

    // Get All Receipts
    [HttpGet ("GetAllReceipts")]
    [Authorize(Roles = "Staff,Admin")]
    [ProducesResponseType(typeof(IEnumerable<ReceiptGetDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllReceipts()
    {
        var receipts = await _receiptService.GetAllReceiptsAsync();
        if (receipts == null || !receipts.Any())
        {
            return NotFound(new { Message = "Nincsenek elérhető számlák." });
        }

        return Ok(receipts);
    }

    // MyUser Receipts
    [HttpGet("user")]
    [Authorize]
    public async Task<IActionResult> GetReceiptsForUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "A felhasználó nincs bejelentkezve." });
        }

        int userId = int.Parse(userIdClaim);

        var result = await _receiptService.GetReceiptsByUserIdAsync(userId);
        return Ok(result);
    }

}