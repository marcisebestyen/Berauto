using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using Services.Configurations;

namespace Services.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}

public class EmailService : IEmailService
{
    private readonly MailSettings _mailSettings;

    public EmailService(IOptions<MailSettings> mailSettings)
    {
        _mailSettings = mailSettings.Value ?? throw new ArgumentNullException(nameof(mailSettings));
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        using (var client = new SmtpClient(_mailSettings.Host, _mailSettings.Port))
        {
            client.Credentials = new NetworkCredential(_mailSettings.Username, _mailSettings.Password);
            client.EnableSsl = true;
            client.DeliveryMethod = SmtpDeliveryMethod.Network;
            
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_mailSettings.FromEmail, _mailSettings.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            try
            {
                await client.SendMailAsync(mailMessage);
                Console.WriteLine($"Email sent to: {toEmail} via Mailtrap");
            }
            catch (SmtpException ex)
            {
                Console.WriteLine($"Error sending email: {ex.Message}");
                Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"General error sending email: {ex.Message}");
                throw;
            }
        }
    }
}