using AutoMapper;
using Database.Dtos.RentDtos;
using Database.Models;
using Services.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services
{
    public enum RentStatusFilter
    {
        All,    
        Open,  
        Closed,  
        Running 
    }


    public interface IRentService
    {
        Task<IEnumerable<RentGetDto>> GetAllRentsAsync(RentStatusFilter statusFilter);
        Task<RentGetDto> AddRentAsync(RentCreateDto createRentDto);
        Task<RentGetDto?> GetRentByIdAsync(int id);
    }

    public class RentService : IRentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public RentService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        public async Task<RentGetDto> AddRentAsync(RentCreateDto createRentDto)
        {
            var rent = _mapper.Map<Rent>(createRentDto);

            await _unitOfWork.RentRepository.InsertAsync(rent);
            await _unitOfWork.SaveAsync();
            
            return _mapper.Map<RentGetDto>(rent);
        }

        public async Task<IEnumerable<RentGetDto>> GetAllRentsAsync(RentStatusFilter statusFilter = RentStatusFilter.All)
        {
            IEnumerable<Rent> rentsFromDb;
            switch (statusFilter)
            {
                case RentStatusFilter.Open:
                    rentsFromDb = await _unitOfWork.RentRepository.GetAsync(r => r.ApprovedBy == null);
                    break;
                case RentStatusFilter.Closed:

                    rentsFromDb = await _unitOfWork.RentRepository.GetAsync(r => r.ActualEnd.HasValue);
                    break;
                case RentStatusFilter.Running:
                    rentsFromDb = await _unitOfWork.RentRepository.GetAsync(r => r.ActualStart.HasValue && !r.ActualEnd.HasValue);
                    break;
                case RentStatusFilter.All:
                default:
                    rentsFromDb = await _unitOfWork.RentRepository.GetAllAsync();
                    break;
            }

            return _mapper.Map<IEnumerable<RentGetDto>>(rentsFromDb);
        }

        public async Task<RentGetDto?> GetRentByIdAsync(int id) 
        {
            var rent = await _unitOfWork.RentRepository.GetByIdAsync(new object[] { id });

            if (rent == null)
            {
                return null;
            }
            return _mapper.Map<RentGetDto>(rent);
        }
    }
}