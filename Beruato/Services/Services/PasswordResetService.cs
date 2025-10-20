using Database.Models;
using Database.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Services.Repositories;

namespace Services.Services;

public interface IPasswordResetService
{
    Task<ServiceResult> InitiatePasswordResetAsync(string email);
    Task<ServiceResult> ValidateAndResetPasswordAsync(string token, string newPassword);
    Task RevokeExpiredTokensAsync();
}

public class PasswordResetService : IPasswordResetService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;
    private readonly ILogger<PasswordResetService> _logger;
    private const int TOKEN_EXPIRATION_MINUTES = 10;

    public PasswordResetService(IUnitOfWork unitOfWork, IEmailService emailService,
        ILogger<PasswordResetService> logger)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<ServiceResult> InitiatePasswordResetAsync(string email)
    {
        try
        {
            var user = (await _unitOfWork.UserRepository.GetAsync(u => u.Email == email)).FirstOrDefault();

            if (user == null)
            {
                _logger.LogWarning("Password reset initiated for non-existent user: {Email}", email);
                return ServiceResult.Failed("A felhasználó nem található.");
            }

            if (!user.RegisteredUser)
            {
                _logger.LogWarning("Password reset attempted for guest user: {Email}", email);
                return ServiceResult.Failed("Jelszó visszaállítás csak regisztrált felhasználóknak érhető el.");
            }

            var existingTokens =
                await _unitOfWork.PasswordResetRepository.GetAsync(pr => pr.UserId == user.Id && !pr.IsRevoked);

            foreach (var oldToken in existingTokens)
            {
                oldToken.IsRevoked = true;
                await _unitOfWork.PasswordResetRepository.UpdateAsync(oldToken);
            }

            var token = GenerateSecureToken();
            var now = DateTime.UtcNow;

            var passwordReset = new PasswordReset
            {
                UserId = user.Id,
                Token = token,
                RequestedAt = now,
                ExpiredAt = now.AddMinutes(TOKEN_EXPIRATION_MINUTES),
                UsedAt = null,
                IsRevoked = false
            };

            await _unitOfWork.PasswordResetRepository.InsertAsync(passwordReset);
            await _unitOfWork.SaveAsync();

            var emailSubject = "Jelszó visszaállítási token";
            var emailBody = $@"
                <html>
                <body>
                    <h2>Jelszó visszaállítás</h2>
                    <p>Kedves {user.Email}!</p>
                    <p>A jelszó visszaállítási tokened:</p>
                    <h3 style='background-color: #f0f0f0; padding: 10px; display: inline-block;'>{token}</h3>
                    <p>Ez a token {TOKEN_EXPIRATION_MINUTES} percig érvényes.</p>
                    <p>Ha nem te kezdeményezted a jelszó visszaállítást, kérjük, hagyd figyelmen kívül ezt az emailt.</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(user.Email, emailSubject, emailBody);

            _logger.LogInformation("Password reset token generated and sent for user: {Email}", email);
            return ServiceResult.Success("A jelszó visszaállítási token elküldve az email címedre.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating password reset for user: {Email}", email);
            return ServiceResult.Failed("Hiba történt a jelszó visszaállítás kezdeményezése közben.");
        }
    }

    public async Task<ServiceResult> ValidateAndResetPasswordAsync(string token, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(newPassword))
        {
            _logger.LogWarning("ValidateAndResetPasswordAsync called with empty token or password.");
            return ServiceResult.Failed("A token és az új jelszó megadása kötelező.");
        }

        try
        {
            var passwordReset = (await _unitOfWork.PasswordResetRepository.GetAsync(pr => pr.Token == token))
                .FirstOrDefault();

            if (passwordReset == null)
            {
                _logger.LogWarning("Invalid password reset token attempted: {Token}", token);
                return ServiceResult.Failed("Érvénytelen token.");
            }

            if (passwordReset.IsRevoked)
            {
                _logger.LogWarning("Revoked token attempted for user ID: {UserId}", passwordReset.UserId);
                return ServiceResult.Failed("Ez a token már nem érvényes.");
            }

            if (DateTime.UtcNow > passwordReset.ExpiredAt)
            {
                _logger.LogWarning("Expired token attempted for user ID: {UserId}", passwordReset.UserId);
                passwordReset.IsRevoked = true;
                await _unitOfWork.PasswordResetRepository.UpdateAsync(passwordReset);
                await _unitOfWork.SaveAsync();
                return ServiceResult.Failed("Ez a token lejárt.");
            }

            var user = (await _unitOfWork.UserRepository.GetAsync(u => u.Id == passwordReset.UserId))
                .FirstOrDefault();

            if (user == null)
            {
                _logger.LogError("User not found for valid password reset token. User ID: {UserId}",
                    passwordReset.UserId);
                return ServiceResult.Failed("A felhasználó nem található.");
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _unitOfWork.UserRepository.UpdateAsync(user);

            passwordReset.UsedAt = DateTime.UtcNow;
            passwordReset.IsRevoked = true;
            await _unitOfWork.PasswordResetRepository.UpdateAsync(passwordReset);

            await _unitOfWork.SaveAsync();

            _logger.LogInformation("Password successfully reset for user ID: {UserId}", user.Id);
            return ServiceResult.Success("A jelszó sikeresen megváltoztatva.");
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error during password reset with token: {Token}", token);
            return ServiceResult.Failed($"Adatbázis hiba történt: {dbEx.InnerException?.Message ?? dbEx.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during password reset with token: {Token}", token);
            return ServiceResult.Failed("Váratlan hiba történt a jelszó módosítása közben.");
        }
    }

    public async Task RevokeExpiredTokensAsync()
    {
        try
        {
            var expiredTokens =
                await _unitOfWork.PasswordResetRepository.GetAsync(pr => !pr.IsRevoked && DateTime.UtcNow > pr.ExpiredAt
                );

            foreach (var token in expiredTokens)
            {
                token.IsRevoked = true;
                await _unitOfWork.PasswordResetRepository.UpdateAsync(token);
            }

            if (expiredTokens.Any())
            {
                await _unitOfWork.SaveAsync();
                _logger.LogInformation("Revoked {Count} expired password reset tokens", expiredTokens.Count());
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking expired tokens");
        }
    }

    private string GenerateSecureToken()
    {
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            var randomNumber = BitConverter.ToUInt32(bytes, 0);
            return (randomNumber % 1000000).ToString("D6");
        }
    }
}