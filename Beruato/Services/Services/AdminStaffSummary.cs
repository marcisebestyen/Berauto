using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Database.Models;
using Services.Repositories;
using Services.Services;
using Microsoft.EntityFrameworkCore;

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

        var adminsAndStaff = await _unitOfWork.UserRepository.GetAsync(u => u.Role == Role.Admin || u.Role == Role.Staff);

        if (!adminsAndStaff.Any())
        {
            Console.WriteLine("AdminStaffSummaryJob: Nincsenek admin vagy staff felhasználók, a feladat befejeződött.");
            return;
        }

        var allCars = await _unitOfWork.CarRepository.GetAllAsync();

        var carsNeedingService = allCars.Where(c => c.ActualKilometers > 25000);

        var upcomingRents = await _unitOfWork.RentRepository.GetAsync(
            r => r.PlannedEnd >= DateTime.Now && r.PlannedEnd <= DateTime.Now.AddDays(7),
            new string[] { "Car", "Renter" });

        var emailContent = new StringBuilder();
        emailContent.AppendLine("<h1>Heti admin összefoglaló</h1>");
        emailContent.AppendLine($"<p>Összes autó a flottában: <strong>{allCars.Count()}</strong></p>");

        if (carsNeedingService.Any())
        {
            emailContent.AppendLine("<h3>Szervizelésre szoruló autók:</h3>");
            emailContent.AppendLine("<ul>");
            foreach (var car in carsNeedingService)
            {
                emailContent.AppendLine($"<li><strong>{car.Brand} {car.Model}</strong> ({car.LicencePlate}) - Jelenlegi km: {car.ActualKilometers}</li>");
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
                emailContent.AppendLine($"<li><strong>{rent.Car.Brand} {rent.Car.Model}</strong> bérlése lejár: <strong>{rent.PlannedEnd.ToShortDateString()}</strong> (Bérlő: {rent.Renter.FirstName} {rent.Renter.LastName})</li>");
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
                await _emailService.SendEmailAsync(user.Email, "Heti admin összefoglaló", emailContent.ToString());
            }
        }

        Console.WriteLine("AdminStaffSummaryJob: A feladat befejeződött.");
    }
}