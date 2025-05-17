using Database.Dtos.ReceiptDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Services.Services;

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

    [HttpGet("{receiptId}")] // Az userId-t az útvonalból kapja
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
    
    [HttpPost]
    [ProducesResponseType(typeof(ReceiptGetDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)] // Validációs vagy üzleti logikai hibák
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
}