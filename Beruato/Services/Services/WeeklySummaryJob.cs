using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.VisualBasic;
using Services.Repositories;

namespace Services.Services
{
    public class WeeklySummaryJob
    {
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;

        public WeeklySummaryJob(IUnitOfWork unitOfWork, IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
        }

        public async Task SendWeeklySummaryAsync()
        {
            Console.WriteLine("WeeklySummaryJob: Indul a heti összefoglaló küldése.");

            var allUsers = await _unitOfWork.UserRepository.GetAsync(u => u.RegisteredUser);

            foreach(var user in allUsers)
            {
                var userId = user.Id;

                var upcomingRents = await _unitOfWork.RentRepository.GetAsync(r => r.RenterId == userId && r.PlannedEnd <= DateTime.Now.AddDays(7) && r.ActualEnd.HasValue == false, new string[] { "Car" });

                if (upcomingRents.Any())
                {
                    var emailContent = $"Szia {user.FirstName}! \n\n" +
                                       $"Összefoglaló a héten lejáró bérléseidről:\n\n" +
                                       $"{string.Join("\n", upcomingRents.Select(r => $"  - Autó: {r.Car.Brand} {r.Car.Model}, Lejárati dátum: {r.PlannedEnd.ToShortDateString()}"))}\n\n" +
                                       "Kérjük, győződj meg róla, hogy időben visszahozod az autót.\n\n" +
                                       "Üdv,\n" +
                                       "A Berauto csapata";

                    Console.WriteLine($"WeeklySummaryJob: E-mail küldése {user.Email} címre.");
                    await _emailService.SendEmailAsync(user.Email, "Heti bérlési összefoglaló", emailContent);
                }
                Console.WriteLine("WeeklySummaryJob: A feladat befejeződött.");
            }
        }
    }
}
