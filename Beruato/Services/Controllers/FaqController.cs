using Microsoft.AspNetCore.Mvc;
using Services.Services;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Beruato.Controllers
{
    [ApiController]
    [Route("api/faq")]
    public class FaqController : ControllerBase
    {
        private readonly FaqService _faqService;
        private readonly ILogger<FaqController> _logger;

        public FaqController(FaqService faqService, ILogger<FaqController> logger)
        {
            _faqService = faqService;
            _logger = logger;
        }

        /// <summary>
        /// Új GYIK (FAQ) bevitele az adatbázisba és vektorizálása a Gemini API-val.
        /// Ez egy adminisztrációs végpont.
        /// </summary>
        [HttpPost("ingest")]
        public async Task<IActionResult> IngestFaq([FromBody] FaqIngestRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Question) || string.IsNullOrWhiteSpace(request.Answer))
            {
                return BadRequest(new { Error = "A 'Question' és 'Answer' mezők kötelezőek." });
            }

            try
            {
                await _faqService.IngestFaqAsync(request.Question, request.Answer);
                return Ok(new { Message = "FAQ sikeresen beírva az adatbázisba és vektorizálva." });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid FAQ ingestion request");
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during FAQ ingestion");
                return StatusCode(500, new { Error = "Hiba történt a FAQ bevitel során." });
            }
        }

        /// <summary>
        /// Válasz generálása egy felhasználói kérdésre a RAG rendszer segítségével (vektoros keresés + Gemini válasz).
        /// </summary>
        [HttpGet("answer")]
        public async Task<IActionResult> GetAnswer([FromQuery] string question)
        {
            _logger.LogInformation("GetAnswer called with question: {Question}", question);

            if (string.IsNullOrWhiteSpace(question))
            {
                _logger.LogWarning("Empty question received");
                return BadRequest(new { Error = "A 'question' paraméter szükséges és nem lehet üres." });
            }

            try
            {
                var answer = await _faqService.GetAnswerFromRAGAsync(question);
                _logger.LogInformation("Answer generated successfully for question: {Question}", question);
                
                // Return with lowercase 'answer' to match common JSON conventions
                return Ok(new { answer = answer });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating answer for question: {Question}", question);
                return StatusCode(500, new { Error = "Hiba történt a válasz generálása közben." });
            }
        }
    }

    public class FaqIngestRequest
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
    }
}