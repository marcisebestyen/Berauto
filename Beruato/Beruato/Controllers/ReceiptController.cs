using Database.Dtos;
using Microsoft.AspNetCore.Mvc;
using Services.Services;
namespace Beruato.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class ReceiptController : ControllerBase
{
    private readonly IReceiptService _receiptsService;

    public ReceiptController(IReceiptService receiptsService)
    {
        _receiptsService = receiptsService;
    }

    [HttpPost]
    public async Task<IActionResult> AddReceipt([FromBody] CreateReceiptDto receiptDto)
    {
        try
        {
            var receipt = await _receiptsService.AddReceipt(receiptDto);
            return CreatedAtAction(nameof(GetReceipt), new { receiptId = receipt.Id }, receipt);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{receiptId}")]
    public async Task<IActionResult> GetReceipt(int receiptId)
    {
        try
        {
            var receipt = await _receiptsService.GetReceipt(receiptId);
            return Ok(receipt);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetReceipts()
    {
        try
        {
            var receipts = await _receiptsService.GetReceipts();
            return Ok(receipts);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{receiptId}")]
    public async Task<IActionResult> UpdateReceipt(int receiptId, [FromBody] UpdateReceiptDto updateReceiptDto)
    {
        try
        {
            var receipt = await _receiptsService.UpdateReceipt(receiptId, updateReceiptDto);
            return Ok(receipt);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{receiptId}")]
    public async Task<IActionResult> DeleteReceipt(int receiptId)
    {
        try
        {
            var result = await _receiptsService.DeleteReceipt(receiptId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}