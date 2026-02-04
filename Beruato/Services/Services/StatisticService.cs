using Database.Dtos.StatisticsDtos;
using Database.Models;
using Microsoft.EntityFrameworkCore;
using Services.Repositories;

namespace Services.Services
{
    public interface IStatisticsService
    {
        Task<DashboardStatisticsDto> GetDashboardStatisticsAsync();
    }

    public class StatisticsService : IStatisticsService
    {
        private readonly IUnitOfWork _unitOfWork;

        public StatisticsService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DashboardStatisticsDto> GetDashboardStatisticsAsync()
        {
            var stats = new DashboardStatisticsDto();

            var allRents = await _unitOfWork.RentRepository.GetAllAsync(includeProperties: new[] { "Car", "Receipt" });
            var allCars = await _unitOfWork.CarRepository.GetAllAsync();
            var allReceipts = await _unitOfWork.ReceiptRepository.GetAllAsync();

            var now = DateTime.UtcNow;

            stats.ActiveRentsCount = allRents.Count(r => r.ActualStart.HasValue && !r.ActualEnd.HasValue);

            stats.PendingRequestsCount = allRents.Count(r => r.ApprovedBy == null && !r.ActualStart.HasValue);

            stats.TotalCarsCount = allCars.Count(c => !c.IsDeleted);
            stats.CarsOnWarningListCount = allCars.Count(c => !c.IsDeleted && !c.InProperCondition);

            stats.TotalRevenueAllTime = allReceipts.Sum(r => r.TotalCost);

            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            stats.RevenueThisMonth = allReceipts
                .Where(r => r.IssueDate >= startOfMonth)
                .Sum(r => r.TotalCost);

            stats.PopularCars = allRents
                .Where(r => r.Car != null)
                .GroupBy(r => r.CarId)
                .Select(g => new PopularCarDto
                {
                    CarId = g.Key,
                    Brand = g.First().Car.Brand,
                    Model = g.First().Car.Model,
                    RentCount = g.Count(),
                })
                .OrderByDescending(x => x.RentCount)
                .Take(5)
                .ToList();

            var thirtyDaysAgo = now.AddDays(-30);

            var rentsLast30Days = allRents
                .Where(r => r.PlannedStart >= thirtyDaysAgo)
                .GroupBy(r => r.PlannedStart.Date)
                .Select(g => new DailyRentCountDto
                {
                    Date = g.Key,
                    Count = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToList();

            stats.RentsLast30Days = FillMissingDates(rentsLast30Days, thirtyDaysAgo, now);

            return stats;
        }

        private List<DailyRentCountDto> FillMissingDates(List<DailyRentCountDto> data, DateTime start, DateTime end)
        {
            var result = new List<DailyRentCountDto>();
            for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
            {
                var existing = data.FirstOrDefault(d => d.Date.Date == date);
                result.Add(existing ?? new DailyRentCountDto { Date = date, Count = 0 });
            }
            return result;
        }
    }
}