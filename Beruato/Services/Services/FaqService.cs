using Database.Data;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Text;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace Services.Services
{
    public class FaqService
    {
        private readonly BerautoDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly string _geminiApiKey;
        private readonly ILogger<FaqService> _logger;

        // Konstans a relevanciához
        // CSÖKKENTVE 0.7-ről 0.5-re a kezdeti tesztelés megkönnyítésére.
        private const double SimilarityThreshold = 0.5;
        private const string GeminiBaseUrl = "https://generativelanguage.googleapis.com/";

        // Hozzáadtuk az ILogger-t a konstruktorhoz a naplózás érdekében
        public FaqService(BerautoDbContext context, string geminiApiKey, ILogger<FaqService> logger)
        {
            _context = context;
            _geminiApiKey = geminiApiKey;
            _logger = logger;
            _httpClient = new HttpClient();
            _httpClient.BaseAddress = new Uri(GeminiBaseUrl); // Base URL beállítása
        }

        /// <summary>
        /// Egy új kérdés-válasz pár mentése az adatbázisba és a vektor generálása a Gemini API-val.
        /// </summary>
        /// <param name="question">A gyakori kérdés.</param>
        /// <param name="answer">A kérdésre adott válasz.</param>
        public async Task IngestFaqAsync(string question, string answer)
        {
            if (string.IsNullOrWhiteSpace(question) || string.IsNullOrWhiteSpace(answer))
            {
                throw new ArgumentException("Question and answer cannot be empty.");
            }

            try
            {
                _logger.LogInformation("FAQ ingestion started for: {Question}", question);

                // 1. Gemini embedding generálása a kérdéshez
                var vectorFloats = await GenerateVectorAsync(question);

                // A vektor konvertálása byte tömbbé a VARBINARY-hez
                byte[] vectorBytes = new byte[vectorFloats.Length * sizeof(float)];
                Buffer.BlockCopy(vectorFloats, 0, vectorBytes, 0, vectorBytes.Length);

                // 2. Új Faq objektum létrehozása és adatbázisba mentése
                var faq = new Faq
                {
                    Question = question,
                    Answer = answer,
                    Vector = vectorBytes
                };

                _context.Faqs.Add(faq);
                await _context.SaveChangesAsync();
                _logger.LogInformation("FAQ successfully ingested and saved.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during FAQ ingestion.");
                throw;
            }
        }

        /// <summary>
        /// Válasz generálása a RAG rendszer segítségével (Retrieval-Augmented Generation).
        /// </summary>
        /// <param name="userQuestion">A felhasználó által feltett kérdés.</param>
        /// <returns>A Gemini által generált válasz, vagy hibaüzenet.</returns>
        public async Task<string> GetAnswerFromRAGAsync(string userQuestion)
        {
            if (string.IsNullOrWhiteSpace(userQuestion))
            {
                return "Kérjük, tegyen fel egy kérdést.";
            }

            try
            {
                _logger.LogInformation("RAG process started for user question: {Question}", userQuestion);

                // 1. Felhasználói kérdés vektorrá alakítása
                var userVectorFloats = await GenerateVectorAsync(userQuestion);

                // 2. Keresés az MSSQL-ben a legrelevánsabb FAQ-ra
                // CRITICAL FIX: Csak azokat az elemeket kérjük le, amelyekhez tartozik vektor.
                var allFaqs = await _context.Faqs.Where(f => f.Vector != null).ToListAsync();

                var relevantFaq = allFaqs
                    .Select(f => new
                    {
                        Faq = f,
                        // Itt már tudjuk, hogy f.Vector nem null, ezért használjuk a "!" operátort
                        Score = CalculateCosineSimilarity(userVectorFloats, f.Vector!)
                    })
                    .OrderByDescending(x => x.Score)
                    .FirstOrDefault();

                // 3. Relevancia-ellenőrzés küszöbértékkel
                if (relevantFaq == null || relevantFaq.Score < SimilarityThreshold)
                {
                    _logger.LogWarning("No relevant context found. Max score: {Score}", relevantFaq?.Score ?? 0);
                    return "Elnézést, erre a kérdésre jelenleg nem találtam releváns információt az adatbázisban.";
                }

                // 4. Válasz generálása a Geminivel (RAG prompt)
                var relevantContext = $"Kérdés: {relevantFaq.Faq.Question}\nVálasz: {relevantFaq.Faq.Answer}";
                var ragPrompt = $"A következő kontextus alapján, válaszolj a kérdésre pontosan és barátságosan. Ha a kontextus nem tartalmazza a választ, mondd, hogy nem tudsz válaszolni.\n\nKONTEXTUS:\n{relevantContext}\n\nFELHASZNÁLÓ KÉRDÉSE: {userQuestion}";

                _logger.LogInformation("Generating final answer with score: {Score}", relevantFaq.Score);

                return await GenerateContentAsync(ragPrompt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during RAG process.");
                return "Sajnálom, hiba történt a válasz generálása közben.";
            }
        }

        /// <summary>
        /// Segédmetódus a Gemini API híváshoz (Embedding), 429 (Rate Limit) hibakezeléssel.
        /// </summary>
        private async Task<float[]> GenerateVectorAsync(string text)
        {
            const int maxRetries = 8;
            const string embeddingModel = "text-embedding-004";

            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                try
                {
                    var geminiRequest = new
                    {
                        content = new
                        {
                            parts = new[] { new { text = text } }
                        }
                    };

                    var response = await _httpClient.PostAsJsonAsync(
                        $"v1beta/models/{embeddingModel}:embedContent?key={_geminiApiKey}",
                        geminiRequest);

                    if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                    {
                        if (attempt < maxRetries - 1)
                        {
                            int delaySeconds = (int)Math.Pow(2, attempt);
                            _logger.LogWarning("Rate limit (429) hit. Retrying in {Delay} seconds...", delaySeconds);
                            await Task.Delay(delaySeconds * 1000);
                            continue; // Újraindítjuk a ciklust
                        }
                        else
                        {
                            throw new HttpRequestException($"Rate limit exceeded after {maxRetries} attempts.", null, response.StatusCode);
                        }
                    }

                    response.EnsureSuccessStatusCode();

                    var responseBody = await response.Content.ReadAsStringAsync();
                    dynamic geminiResponse = JsonConvert.DeserializeObject(responseBody) ?? throw new Exception("Invalid Gemini response.");

                    // Sikeres válasz, visszaadjuk a vektort
                    return geminiResponse?.embedding?.values.ToObject<float[]>() ?? Array.Empty<float>();
                }
                catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    _logger.LogError(ex, "Final failure handling for 429.");
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An unexpected error occurred during vector generation.");
                    throw;
                }
            }
            return Array.Empty<float>();
        }

        /// <summary>
        /// Segédmetódus a Gemini API híváshoz (Generation).
        /// </summary>
        private async Task<string> GenerateContentAsync(string prompt)
        {
            var responseBody = string.Empty;
            try
            {
                var generateRequest = new
                {
                    contents = new[]
                    {
                        new { role = "user", parts = new[] { new { text = prompt } } }
                    },
                    // A 'config' helyett a helyes 'generationConfig' mezőt használjuk.
                    generationConfig = new { temperature = 0.1 }
                };

                // Relatív URL használata, a flash modell javasolt
                var response = await _httpClient.PostAsJsonAsync(
                    $"v1beta/models/gemini-2.5-flash:generateContent?key={_geminiApiKey}",
                    generateRequest);

                responseBody = await response.Content.ReadAsStringAsync(); // Olvassuk be a válasz törzsét HIBÁS kód esetén is!

                response.EnsureSuccessStatusCode();

                dynamic generatedGeminiResponse = JsonConvert.DeserializeObject(responseBody) ?? throw new Exception("Invalid Gemini response.");

                return generatedGeminiResponse?.candidates[0]?.content?.parts[0]?.text;
            }
            catch (Exception ex)
            {
                // Részletesebb naplózás, beleértve a szerver válaszát is
                _logger.LogError(ex, "Error during Gemini content generation (GenerateContentAsync). Server Response: {ResponseBody}", responseBody);
                throw;
            }
        }

        /// <summary>
        /// A koszinusz hasonlóság kiszámítása két vektor között.
        /// </summary>
        private double CalculateCosineSimilarity(float[] vector1, byte[] vector2Bytes)
        {
            float[] vector2 = new float[vector2Bytes.Length / sizeof(float)];
            Buffer.BlockCopy(vector2Bytes, 0, vector2, 0, vector2Bytes.Length);

            if (vector1.Length != vector2.Length)
            {
                _logger.LogError("Vector lengths mismatch: {L1} vs {L2}", vector1.Length, vector2.Length);
                return 0;
            }

            double dotProduct = 0;
            double magnitude1 = 0;
            double magnitude2 = 0;

            for (int i = 0; i < vector1.Length; i++)
            {
                dotProduct += vector1[i] * vector2[i];
                magnitude1 += Math.Pow(vector1[i], 2);
                magnitude2 += Math.Pow(vector2[i], 2);
            }

            // Elkerüljük a nulla osztást
            if (magnitude1 == 0 || magnitude2 == 0) return 0;

            return dotProduct / (Math.Sqrt(magnitude1) * Math.Sqrt(magnitude2));
        }
    }
}
