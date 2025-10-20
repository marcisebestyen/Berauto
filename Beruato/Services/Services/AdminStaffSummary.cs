using System.Text;
using Database.Models;
using Services.Repositories;
using Services.Services;

public class AdminStaffSummaryJob
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;

    public AdminStaffSummaryJob(IUnitOfWork unitOfWork, IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
    }

    public async Task SendAdminStaffSummaryAsync()
    {
        Console.WriteLine("AdminStaffSummaryJob: Indul az admin összefoglaló küldése.");

        var adminsAndStaff =
            await _unitOfWork.UserRepository.GetAsync(u => u.Role == Role.Admin || u.Role == Role.Staff);
        if (!adminsAndStaff.Any())
        {
            Console.WriteLine("AdminStaffSummaryJob: Nincsenek admin vagy staff felhasználók, a feladat befejeződött.");
            return;
        }

        var allCars = await _unitOfWork.CarRepository.GetAllAsync();

        var carsNeedingInspection = allCars.Where(c =>
        {
            if (c.IsDeleted || !c.LastTechnicalInspection.HasValue)
                return false;

            var oneYearFromLastInspection = c.LastTechnicalInspection.Value.AddYears(1);
            var timeBasedDue = oneYearFromLastInspection <= DateTime.Now.AddDays(7);

            var kmBasedDue = false;
            if (c.KilometersAtLastInspection.HasValue)
            {
                var kmsSinceLastInspection = c.ActualKilometers - c.KilometersAtLastInspection.Value;
                kmBasedDue = kmsSinceLastInspection >= 9500;
            }

            return timeBasedDue || kmBasedDue;
        });

        var upcomingRents = await _unitOfWork.RentRepository.GetAsync(
            r => r.PlannedEnd >= DateTime.Now && r.PlannedEnd <= DateTime.Now.AddDays(7),
            new string[] { "Car", "Renter" });

        var emailContent = new StringBuilder();
        emailContent.AppendLine("<h1>Heti admin összefoglaló</h1>");
        emailContent.AppendLine($"<p>Összes autó a flottában: <strong>{allCars.Count()}</strong></p>");

        if (carsNeedingInspection.Any())
        {
            emailContent.AppendLine("<h3>⚠️ SÜRGŐS: Szervíz esedékes:</h3>");
            emailContent.AppendLine("<ul>");
            foreach (var car in carsNeedingInspection)
            {
                var reason = "";
                if (car.LastTechnicalInspection.HasValue)
                {
                    var oneYearFromLast = car.LastTechnicalInspection.Value.AddYears(1);
                    var daysUntilOneYear = (oneYearFromLast - DateTime.Now).Days;

                    var kmsSinceLast = car.KilometersAtLastInspection.HasValue
                        ? car.ActualKilometers - car.KilometersAtLastInspection.Value
                        : 0;

                    if (daysUntilOneYear <= 7)
                        reason += $"1 év telik el: {oneYearFromLast.ToShortDateString()} ({daysUntilOneYear} nap)";

                    if (kmsSinceLast >= 9500)
                    {
                        if (!string.IsNullOrEmpty(reason)) reason += " ÉS ";
                        reason += $"Futott: {kmsSinceLast:F0} km";
                    }
                }

                emailContent.AppendLine(
                    $"<li><strong>{car.Brand} {car.Model}</strong> ({car.LicencePlate}) - {reason}</li>");
            }

            emailContent.AppendLine("</ul>");
        }
        else
        {
            emailContent.AppendLine("<p>Nincsenek szervizelésre szoruló autók.</p>");
        }

        if (upcomingRents.Any())
        {
            emailContent.AppendLine("<h3>Közelgő lejárati idővel rendelkező bérlések (következő 7 nap):</h3>");
            emailContent.AppendLine("<ul>");
            foreach (var rent in upcomingRents)
            {
                emailContent.AppendLine(
                    $"<li><strong>{rent.Car.Brand} {rent.Car.Model}</strong> bérlése lejár: <strong>{rent.PlannedEnd.ToShortDateString()}</strong> (Bérlő: {rent.Renter.FirstName} {rent.Renter.LastName})</li>");
            }

            emailContent.AppendLine("</ul>");
        }
        else
        {
            emailContent.AppendLine("<p>A következő 7 napban nem jár le bérlés.</p>");
        }

        foreach (var user in adminsAndStaff)
        {
            if (!string.IsNullOrWhiteSpace(user.Email))
            {
                try
                {
                    await _emailService.SendEmailAsync(user.Email, "Heti admin összefoglaló", emailContent.ToString());
                    await Task.Delay(10000);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Hiba az email küldése során: {ex.Message}");
                }
            }
        }

        Console.WriteLine("AdminStaffSummaryJob: A feladat befejeződött.");
    }
}