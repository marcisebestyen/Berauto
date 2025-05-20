using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services
{
    using AutoMapper;
    using Database.Dtos.RentDtos;
    using Database.Models;
    using global::Services.Repositories;
    
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    namespace Services.Services
    {
        public interface IStaffService
        {
            Task<RentGetDto> ApprovedBy(int staffId, int rentId);
            Task<RentGetDto> IssuedBy(int staffId, int rentId, DateTime actualStart);
            Task<RentGetDto> TakenBackBy(int staffId, int rentId, DateTime actualEnd, decimal endingKilometer);

        }
        public class StaffService : IStaffService
        {
            private IUnitOfWork _unitOfWork;
            private IMapper _mapper;

            public StaffService(IUnitOfWork unitOfWork, IMapper mapper)
            {
                _mapper = mapper;
                _unitOfWork = unitOfWork;
            }
            public async Task<RentGetDto> ApprovedBy(int staffId, int rentId)
            {
                var user = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
                if (user == null || (user.Role != Role.Staff && user.Role != Role.Admin))
                {
                    throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff.");
                }
                var rent = await _unitOfWork.RentRepository.GetByIdAsync(new object[] { rentId });
                if (rent != null)
                {
                    rent.ApprovedBy = staffId;
                    await _unitOfWork.RentRepository.UpdateAsync(rent);
                    await _unitOfWork.SaveAsync();
                    return await Task.FromResult(_mapper.Map<RentGetDto>(rent));
                }
                else
                {
                    throw new KeyNotFoundException($"Rent with id {rentId} not found.");
                }
            }
            public async Task<RentGetDto> IssuedBy(int staffId, int rentId, DateTime actualStart)
            {
                // 1. Staff (alkalmazott) ellenőrzése
                var staffUser = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
                if (staffUser == null || (staffUser.Role != Role.Staff && staffUser.Role != Role.Admin))
                {
                    throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff.");
                }

                // 2. Bérlemény (Rent) lekérdezése
                var rent = await _unitOfWork.RentRepository.GetByIdAsync(new object[] { rentId });
                if (rent == null)
                {
                    throw new KeyNotFoundException($"Rent with id {rentId} not found.");
                }

                if (rent.CarId == null || rent.CarId <= 0)
                {
                    throw new InvalidOperationException($"Rent with id {rentId} does not have a valid CarId assigned.");
                }


                var car = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { rent.CarId });
                if (car == null)
                {
                    throw new KeyNotFoundException($"Car with id {rent.CarId} associated with rent {rentId} not found.");
                }

                rent.IssuedBy = staffId;
                rent.ActualStart = actualStart;
                rent.StartingKilometer = car.ActualKilometers; 

                // 5. Változtatások mentése
                try
                {
                    await _unitOfWork.RentRepository.UpdateAsync(rent);
                    await _unitOfWork.SaveAsync();
                }
                catch (Exception ex)
                {
                    throw;
                }

                // 6. Eredmény visszaadása (DTO-ba mappelve)
                return _mapper.Map<RentGetDto>(rent);
            }
            public async Task<RentGetDto> TakenBackBy(int staffId, int rentId, DateTime actualEnd, decimal endingKilometer)
            {
                // 1. Staff (alkalmazott) ellenőrzése
                var staffUser = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
                if (staffUser == null || (staffUser.Role != Role.Staff && staffUser.Role != Role.Admin))
                {
                    throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff.");
                }

                // 2. Bérlemény (Rent) lekérdezése
                var rent = await _unitOfWork.RentRepository.GetByIdAsync(new object[] { rentId });
                if (rent == null)
                {
                    throw new KeyNotFoundException($"Rent with id {rentId} not found.");
                }

                // Ellenőrizzük, hogy a bérleményhez van-e rendelve autó azonosító
                if (rent.CarId == null || rent.CarId <= 0)
                {
                    throw new InvalidOperationException($"Rent with id {rentId} does not have a valid CarId assigned.");
                }

                // 3. Autó (Car) lekérdezése a bérlemény CarId-ja alapján
                var car = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { rent.CarId });
                if (car == null)
                {
                    // Adatkonzisztencia probléma, ha a Rent.CarId egy nem létező autóra mutat
                    throw new KeyNotFoundException($"Car with id {rent.CarId} associated with rent {rentId} not found.");
                }

                if (endingKilometer < rent.StartingKilometer)
                {
                    throw new InvalidOperationException($"Ending kilometer ({endingKilometer}) cannot be less than starting kilometer ({rent.StartingKilometer}).");
                }

                // 4. Bérlemény adatainak frissítése
                rent.TakenBackBy = staffId;
                rent.ActualEnd = actualEnd;
                rent.EndingKilometer = endingKilometer;

                // 5. Autó kilométerórájának frissítése
                car.ActualKilometers = endingKilometer;

                // 6. Változtatások mentése (mind a Rent, mind a Car entitáson)
                try
                {
                    await _unitOfWork.RentRepository.UpdateAsync(rent);
                    await _unitOfWork.CarRepository.UpdateAsync(car); // Fontos, hogy az autó módosítását is jelezzük
                    await _unitOfWork.SaveAsync(); // Ez menti az összes nyomon követett változást atomi műveletként
                }
                catch (Exception ex)
                {
                    throw;
                }

                return _mapper.Map<RentGetDto>(rent);
            }
        }

    }

}
