using Microsoft.AspNetCore.Mvc;
using Services.Services;
using Microsoft.Extensions.Logging;
using System;

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
        /// Debug endpoint - összes FAQ listázása
        /// </summary>
        [HttpGet("debug/list")]
        public async Task<IActionResult> DebugListFaqs()
        {
            try
            {
                var result = await _faqService.GetAllFaqsDebugAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing FAQs");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Debug endpoint - vektoros hasonlóság tesztelése
        /// </summary>
        [HttpGet("debug/similarity")]
        public async Task<IActionResult> DebugVectorSimilarity([FromQuery] string question)
        {
            if (string.IsNullOrWhiteSpace(question))
            {
                return BadRequest(new { Error = "A 'question' paraméter kötelező." });
            }

            try
            {
                var result = await _faqService.DebugVectorSimilarityAsync(question);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing vector similarity");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Új GYIK (FAQ) bevitele az adatbázisba és vektorizálása a Gemini API-val.
        /// Ez egy adminisztrációs végpont.
        /// </summary>
        [HttpPost("ingest")]
        public async Task<IActionResult> IngestFaq([FromBody] FaqIngestRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Question) ||
                string.IsNullOrWhiteSpace(request.Answer))
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

                return Ok(new { answer = answer });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating answer for question: {Question}", question);
                return StatusCode(500, new { Error = "Hiba történt a válasz generálása közben." });
            }
            
        }
        /// <summary>
        /// ADMIN: Újragenerálja az összes FAQ vektorát az adatbázisban.
        /// Ezt a műveletet csak bejelentkezett adminisztrátor hívhatja meg.
        /// </summary>
        [HttpPost("regenerate-vectors")] // A hívási útvonal: POST /api/Faq/regenerate-vectors
        // [Authorize(Roles = "Admin")] // Ezt utólagosan érdemes hozzáadni!
        public async Task<IActionResult> RegenerateVectors()
        {
            _logger.LogInformation("Admin request: Starting FAQ vector regeneration.");
            try
            {
                // Meghívjuk a FaqService metódusát
                var result = await _faqService.RegenerateAllVectorsAsync();

                _logger.LogInformation("Admin request: Vector regeneration finished successfully.");

                // Visszaadjuk a statisztikát, hogy az admin lássa az eredményt
                return Ok(new
                {
                    Message = "Az összes FAQ vektorának újragenerálása sikeresen befejeződött.",
                    Details = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Admin request: Error during vector regeneration.");
                return StatusCode(500, new { Message = "Hiba történt a vektorok újragenerálása során.", Error = ex.Message });
            }
        }
        // ... (A FaqController osztályban)

        /// <summary>
        /// ADMIN: Törli az összes FAQ bejegyzést az adatbázisból.
        /// </summary>
        [HttpPost("clear-all")] // Útvonal: POST /api/Faq/clear-all
                                // [Authorize(Roles = "SuperAdmin")] // Ajánlott!
        public async Task<IActionResult> ClearAllFaqs()
        {
            _logger.LogWarning("Admin request: Starting to clear all FAQ data.");
            try
            {
                int deletedCount = await _faqService.ClearAllFaqsAsync();

                return Ok(new
                {
                    Message = $"Az összes FAQ bejegyzés sikeresen törölve lett. ({deletedCount} darab)",
                    DeletedCount = deletedCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Admin request: Error during clearing all FAQ data.");
                return StatusCode(500, new { Message = "Hiba történt az adatok törlése során.", Error = ex.Message });
            }
        }
    }

    public class FaqIngestRequest
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
    }
}