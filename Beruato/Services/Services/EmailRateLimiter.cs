using System;
using System.Threading;
using System.Threading.Tasks;

namespace Services.Services
{
    /// <summary>
    /// Centralized rate limiter for email sending to prevent exceeding SMTP provider limits.
    /// Uses a semaphore to ensure only one email is sent at a time across all instances.
    /// </summary>
    public class EmailRateLimiter
    {
        private readonly SemaphoreSlim _semaphore;
        private readonly int _delayMilliseconds;

        public EmailRateLimiter(int delayMilliseconds = 1000)
        {
            _semaphore = new SemaphoreSlim(1, 1);
            _delayMilliseconds = delayMilliseconds;
        }

        /// <summary>
        /// Executes an email sending operation with rate limiting.
        /// Ensures only one email is sent at a time with a configured delay between sends.
        /// </summary>
        public async Task ExecuteAsync(Func<Task> emailSendOperation)
        {
            await _semaphore.WaitAsync();
            try
            {
                await emailSendOperation();
                await Task.Delay(_delayMilliseconds);
            }
            finally
            {
                _semaphore.Release();
            }
        }
    }
}
