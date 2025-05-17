using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services
{
    using AutoMapper;
    using Database.Dtos.RentDtos;
    using global::Services.Repositories;
    
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    namespace Services.Services
    {
        public interface IStaffService
        {
            Task<RentGetDto> ApprovedBy(int staffId, int rentId);
            Task<RentGetDto> IssuedBy(int staffId, int rentId, DateTime actualStart, decimal startingKilometer);
            Task<RentGetDto> TakenBackBy(int staffId, int rentId, DateTime actualEnd, decimal endingKilometer);

        }
        public class StaffServise : IStaffService
        {
            private IUnitOfWork _unitOfWork;
            private IMapper _mapper;

            public StaffServise(IUnitOfWork unitOfWork, IMapper mapper)
            {
                _mapper = mapper;
                _unitOfWork = unitOfWork;
            }
            public async Task<RentGetDto> ApprovedBy(int staffId, int rentId)
            {
                var user = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
                if (user == null || user.Role != Database.Models.Role.Staff)
                {
                    throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff.");
                }
                var rent = await _unitOfWork.RentRepository.GetByIdAsync(new object[] { rentId });
                if (rent != null)
                {
                    rent.ApprovedBy = staffId;
                    await _unitOfWork.RentRepository.UpdateAsync(rent);
                    _unitOfWork.SaveAsync();
                    return await Task.FromResult(_mapper.Map<RentGetDto>(rent));
                }
                else
                {
                    throw new KeyNotFoundException($"Rent with id {rentId} not found.");
                }
            }
            public async Task<RentGetDto> IssuedBy(int staffId, int rentId, DateTime actualStart, decimal startingKilometer)
            {
                var user = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
                if (user == null || user.Role != Database.Models.Role.Staff)
                {
                    throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff.");
                }
                var rent = await _unitOfWork.RentRepository.GetByIdAsync(new object[] { rentId });
                if (rent != null)
                {
                    rent.IssuedBy = staffId;
                    rent.ActualStart = actualStart;
                    rent.StartingKilometer = startingKilometer;
                    await _unitOfWork.RentRepository.UpdateAsync(rent);
                    _unitOfWork.SaveAsync();
                    return await Task.FromResult(_mapper.Map<RentGetDto>(rent));
                }
                else
                {
                    throw new KeyNotFoundException($"Rent with id {rentId} not found.");
                }
            }
            public async Task<RentGetDto> TakenBackBy(int staffId, int rentId, DateTime actualEnd, decimal endingKilometer)
            {
                var user = await _unitOfWork.UserRepository.GetByIdAsync(new object[] { staffId });
                if (user == null || user.Role != Database.Models.Role.Staff)
                {
                    throw new KeyNotFoundException($"User with id {staffId} not found or user is not staff.");
                }
                var rent = await _unitOfWork.RentRepository.GetByIdAsync(new object[] { rentId });
                if (rent != null)
                {
                    rent.TakenBackBy = staffId;
                    rent.ActualEnd = actualEnd;
                    rent.EndingKilometer = endingKilometer;
                    await _unitOfWork.RentRepository.UpdateAsync(rent);
                    _unitOfWork.SaveAsync();
                    return await Task.FromResult(_mapper.Map<RentGetDto>(rent));
                }
                else
                {
                    throw new KeyNotFoundException($"Rent with id {rentId} not found.");
                }
            }
        }

    }

}
