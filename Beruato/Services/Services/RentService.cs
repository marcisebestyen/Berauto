using AutoMapper;
using Database.Dtos.RentDtos;
using Database.Models;
using Services.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Database.Dtos.UserDtos;


namespace Services.Services
{
    public enum RentStatusFilter
    {
        All,
        Open,           // Jóváhagyásra vár (ApprovedBy == null)
        Closed,         // Lezárt (ActualEnd.HasValue)
        Running,        // Futó (ActualStart.HasValue && !ActualEnd.HasValue)
        ApprovedForHandover // ÚJ: Jóváhagyva, átadásra vár (ApprovedBy != null && ActualStart == null)
    }

    public interface IRentService
    {
        Task<IEnumerable<RentGetDto>> GetAllRentsAsync(RentStatusFilter statusFilter, int? userId);
        Task<RentGetDto> AddRentAsync(RentCreateDto createRentDto);
        Task<RentGetDto?> GetRentByIdAsync(int id);
        Task<RentGetDto> AddGuestRentAsync(GuestRentCreateDto createGuestRentDto);
    }

    public class RentService : IRentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IUserService _userService;

        public RentService(IUnitOfWork unitOfWork, IMapper mapper, IUserService userService)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
        }

        public async Task<RentGetDto> AddRentAsync(RentCreateDto createRentDto)
        {
            var rent = _mapper.Map<Rent>(createRentDto);

            await _unitOfWork.RentRepository.InsertAsync(rent);
            await _unitOfWork.SaveAsync();

            var createdRentWithDetails = await GetRentByIdAsync(rent.Id);
            return createdRentWithDetails ?? throw new InvalidOperationException("Failed to retrieve created rent with details.");
        }

        public async Task<RentGetDto> AddGuestRentAsync(GuestRentCreateDto createGuestRentDto)
        {
            if (createGuestRentDto == null)
            {
                throw new ArgumentNullException(nameof(createGuestRentDto));
            }

            var guestUserDetails = new UserCreateGuestDto
            {
                FirstName = createGuestRentDto.FirstName,
                LastName = createGuestRentDto.LastName,
                Email = createGuestRentDto.Email,
                PhoneNumber = createGuestRentDto.PhoneNumber,
                LicenceId = createGuestRentDto.LicenceId
            };
            var guestUser = await _userService.GetOrCreateGuestUserAsync(guestUserDetails);

            var rent = new Rent
            {
                CarId = createGuestRentDto.CarId,
                RenterId = guestUser.Id,
                PlannedStart = createGuestRentDto.PlannedStart,
                PlannedEnd = createGuestRentDto.PlannedEnd,
                InvoiceRequest = createGuestRentDto.InvoiceRequest,
            };

            await _unitOfWork.RentRepository.InsertAsync(rent);
            await _unitOfWork.SaveAsync();

            var createdRentWithDetails = await GetRentByIdAsync(rent.Id);
            return createdRentWithDetails ?? throw new InvalidOperationException("Failed to retrieve created guest rent with details.");
        }


        public async Task<IEnumerable<RentGetDto>> GetAllRentsAsync(RentStatusFilter statusFilter = RentStatusFilter.All, int? userId = null)
        {
            Expression<Func<Rent, bool>>? predicate = null;
            bool useGenericGetAsync = true; 

            switch (statusFilter)
            {
                case RentStatusFilter.Open: 
                    if (userId.HasValue)
                        predicate = r => r.RenterId == userId.Value && r.ApprovedBy == null && !r.ActualStart.HasValue;
                    else
                        predicate = r => r.ApprovedBy == null && !r.ActualStart.HasValue; 
                    break;
                case RentStatusFilter.ApprovedForHandover: 
                    if (userId.HasValue)
                        predicate = r => r.RenterId == userId.Value && r.ApprovedBy != null && !r.ActualStart.HasValue;
                    else
                        predicate = r => r.ApprovedBy != null && !r.ActualStart.HasValue;
                    break;
                case RentStatusFilter.Running:
                    if (userId.HasValue)
                        predicate = r => r.RenterId == userId.Value && r.ActualStart.HasValue && !r.ActualEnd.HasValue;
                    else
                        predicate = r => r.ActualStart.HasValue && !r.ActualEnd.HasValue;
                    break;
                case RentStatusFilter.Closed:
                    if (userId.HasValue)
                        predicate = r => r.RenterId == userId.Value && r.ActualEnd.HasValue;
                    else
                        predicate = r => r.ActualEnd.HasValue;
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
            string[] includeProps = { "Car", "Renter" }; 

            if (useGenericGetAsync && predicate != null)
            {
                rentsFromDb = await _unitOfWork.RentRepository.GetAsync(predicate, includeProperties: includeProps);
            }
            else if (!useGenericGetAsync)
            {
                rentsFromDb = await _unitOfWork.RentRepository.GetAllAsync(includeProperties: includeProps);
            }
            else
            {
               
                rentsFromDb = Enumerable.Empty<Rent>();
            }

            return _mapper.Map<IEnumerable<RentGetDto>>(rentsFromDb);
        }

        public async Task<RentGetDto?> GetRentByIdAsync(int id)
        {
            string[] includeProps = { "Car" };
            var rents = await _unitOfWork.RentRepository.GetAsync(r => r.Id == id, includeProperties: includeProps);
            var rent = rents.FirstOrDefault();

            if (rent == null)
            {
                return null;
            }
            return _mapper.Map<RentGetDto>(rent);
        }
    }
}
