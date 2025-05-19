using AutoMapper;
using Database.Dtos.RentDtos;
using Database.Models;
using Services.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
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
            _userService = userService;
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
            Expression<Func<Rent, bool>>? predicate = null;
            bool useGenericGetAsync = true;

            // Predikátum összeállítása a statusFilter alapján (ez a rész változatlan)
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
            // Definiáljuk a betöltendő navigációs property-t
            string[] includeProps = { "Car" }; // Feltételezve, hogy a Rent entitáson 'Car' a navigációs property neve

            if (useGenericGetAsync && predicate != null)
            {
                // Átadjuk az includeProperties paramétert a GetAsync hívásnak
                rentsFromDb = await _unitOfWork.RentRepository.GetAsync(predicate, includeProperties: includeProps);
            }
            else if (!useGenericGetAsync) // Ez csak akkor igaz, ha statusFilter=All ÉS userId=null
            {
                // Átadjuk az includeProperties paramétert a GetAllAsync hívásnak
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
            string[] includeProps = { "Car" }; // Feltételezve, hogy a Rent entitáson 'Car' a navigációs property neve

            var rents = await _unitOfWork.RentRepository.GetAsync(r => r.Id == id, includeProperties: includeProps);
            var rent = rents.FirstOrDefault();

            if (rent == null)
            {
                return null;
            }
            return _mapper.Map<RentGetDto>(rent);
        }
        public async Task<RentGetDto> AddGuestRentAsync(GuestRentCreateDto createGuestRentDto)
        {
            if (createGuestRentDto == null)
            {
                throw new ArgumentNullException(nameof(createGuestRentDto));
            }

            // 1. Vendég felhasználó lekérése vagy létrehozása
            var guestUserDetails = new UserCreateGuestDto
            {
                FirstName = createGuestRentDto.FirstName,
                LastName = createGuestRentDto.LastName,
                Email = createGuestRentDto.Email,
                PhoneNumber = createGuestRentDto.PhoneNumber,
                LicenceId = createGuestRentDto.LicenceId
            };
            var guestUser = await _userService.GetOrCreateGuestUserAsync(guestUserDetails); // Feltételezve, hogy a _userService be van injektálva

            // 2. Rent entitás létrehozása a vendég felhasználó ID-jával
            var rent = new Rent // Közvetlenül hozzuk létre a Rent entitást, nem mapperrel a GuestRentCreateDto-ból
            {
                CarId = createGuestRentDto.CarId,
                RenterId = guestUser.Id, // A frissen létrehozott/megtalált vendég ID-ja
                PlannedStart = createGuestRentDto.PlannedStart, // A DTO-ban PlannedStart és PlannedEnd van
                PlannedEnd = createGuestRentDto.PlannedEnd,
                InvoiceRequest = createGuestRentDto.InvoiceRequest,
                // Egyéb alapértelmezett értékek a Rent entitáshoz, ha vannak
                // Pl. ApprovedBy, IssuedBy stb. kezdetben nullok lesznek
            };

            await _unitOfWork.RentRepository.InsertAsync(rent);
            await _unitOfWork.SaveAsync();

            // Visszaadhatjuk a teljes RentGetDto-t, ha az AutoMapper tudja kezelni a Rent -> RentGetDto mapelést
            // Ehhez a 'rent' objektumot be kell tölteni a kapcsolt adatokkal, ha a RentGetDto igényli (pl. Car.Brand)
            // Vagy egy egyszerűsített visszaadási típust használunk.
            // Most feltételezzük, hogy a _mapper.Map<RentGetDto>(rent) működik,
            // de lehet, hogy a 'rent' objektumot újra le kell kérdezni az include-okkal.
            // Egy biztonságosabb megoldás:
            var createdRentWithDetails = await GetRentByIdAsync(rent.Id); // Ez már include-olja a Car-t, ha a GetRentByIdAsync úgy van megírva
            return createdRentWithDetails ?? throw new InvalidOperationException("Failed to retrieve created guest rent with details.");
        }
    }
}
