using Microsoft.AspNetCore.Mvc;
using Services.Services;
using System.Threading.Tasks;

namespace Beruato.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FaqController : ControllerBase
    {
        private readonly FaqService _faqService;
        public FaqController(FaqService faqService)
        {
            _faqService = faqService;
        }

        /// <summary>
        /// Új GYIK (FAQ) bevitele az adatbázisba és vektorizálása a Gemini API-val.
        /// Ez egy adminisztrációs végpont.
        /// </summary>
        [HttpPost("ingest")]
        public async Task<IActionResult> IngestFaq([FromBody] FaqIngestRequest request)
        {
            try
            {
                await _faqService.IngestFaqAsync(request.Question, request.Answer);
                return Ok(new { Message = "FAQ sikeresen beírva az adatbázisba és vektorizálva." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Hiba történt a FAQ bevitel során." });
            }
        }

        /// <summary>
        /// Válasz generálása egy felhasználói kérdésre a RAG rendszer segítségével (vektoros keresés + Gemini válasz).
        /// </summary>
        [HttpGet("answer")]
        public async Task<IActionResult> GetAnswer([FromQuery] string question)
        {
            if (string.IsNullOrWhiteSpace(question))
            {
                return BadRequest(new { Error = "A 'question' paraméter szükséges." });
            }

            try
            {
                var answer = await _faqService.GetAnswerFromRAGAsync(question);
                return Ok(new { Answer = answer });
            }
            catch (Exception)
            {
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
