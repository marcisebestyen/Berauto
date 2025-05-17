using AutoMapper;
using Database.Dtos.RentDtos;
using Database.Models;
using Services.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
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
        Task<IEnumerable<RentGetDto>> GetAllRentsAsync(RentStatusFilter statusFilter, int? userId);
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

        public async Task<IEnumerable<RentGetDto>> GetAllRentsAsync(RentStatusFilter statusFilter = RentStatusFilter.All, int? userId = null)
        {
            Expression<Func<Rent, bool>>? predicate = null; // Nullable expression
            bool useGenericGetAsync = true; // Jelzi, hogy a GetAsync-ot vagy a GetAllAsync-ot hívjuk-e

            // Predikátum összeállítása a statusFilter alapján
            switch (statusFilter)
            {
                case RentStatusFilter.Open:
                    if (userId.HasValue)
                        predicate = r => r.RenterId == userId.Value && r.ApprovedBy == null;
                    else
                        predicate = r => r.ApprovedBy == null;
                    break;
                case RentStatusFilter.Closed:
                    if (userId.HasValue)
                        predicate = r => r.RenterId == userId.Value && r.ActualEnd.HasValue;
                    else
                        predicate = r => r.ActualEnd.HasValue;
                    break;
                case RentStatusFilter.Running:
                    if (userId.HasValue)
                        predicate = r => r.RenterId == userId.Value && r.ActualStart.HasValue && !r.ActualEnd.HasValue;
                    else
                        predicate = r => r.ActualStart.HasValue && !r.ActualEnd.HasValue;
                    break;
                case RentStatusFilter.All:
                default:
                    if (userId.HasValue)
                    {
                        predicate = r => r.RenterId == userId.Value;
                    }
                    else
                    {
                        useGenericGetAsync = false;
                    }
                    break;
            }

            IEnumerable<Rent> rentsFromDb;
            if (useGenericGetAsync && predicate != null)
            {
                rentsFromDb = await _unitOfWork.RentRepository.GetAsync(predicate);
            }
            else if (!useGenericGetAsync) // Ez csak akkor igaz, ha statusFilter=All ÉS userId=null
            {
                rentsFromDb = await _unitOfWork.RentRepository.GetAllAsync();
            }
            else
            {
                rentsFromDb = Enumerable.Empty<Rent>();
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