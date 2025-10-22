using AutoMapper;
using Database.Dtos.RentDtos;
using Database.Models;
using Services.Repositories;
using System.Linq.Expressions;
using Database.Dtos;


namespace Services.Services
{
    public enum RentStatusFilter
    {
        All,
        Open,
        Closed,
        Running,
        ApprovedForHandover
    }

    public interface IRentService
    {
        Task<IEnumerable<RentGetDto>> GetAllRentsAsync(RentStatusFilter statusFilter, int? userId);
        Task<RentGetDto> AddRentAsync(RentCreateDto createRentDto);
        Task<RentGetDto?> GetRentByIdAsync(int id);
        Task<RentGetDto> AddGuestRentAsync(GuestRentCreateDto createGuestRentDto);
        Task<WaitingList?> AddToWaitingListAsync(WaitingListCreateDto waitingListDto);
        Task ProcessCarReturnForWaitingListAsync(int carId);
        Task HandleRentCompletion(int rentId);
        Task<IEnumerable<RentGetDto>> GetRentsByCarIdAsync(int carId);
    }

    public class RentService : IRentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IUserService _userService;
        private readonly IEmailService _emailService;

        public RentService(IUnitOfWork unitOfWork, IMapper mapper, IUserService userService, IEmailService emailService)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
            _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        }

        public async Task<RentGetDto> AddRentAsync(RentCreateDto createRentDto)
        {
            var rent = _mapper.Map<Rent>(createRentDto);

            await _unitOfWork.RentRepository.InsertAsync(rent);
            await _unitOfWork.SaveAsync();

            var createdRentWithDetails = await GetRentByIdAsync(rent.Id);
            return createdRentWithDetails ??
                   throw new InvalidOperationException("Failed to retrieve created rent with details.");
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
            return createdRentWithDetails ??
                   throw new InvalidOperationException("Failed to retrieve created guest rent with details.");
        }


        public async Task<IEnumerable<RentGetDto>> GetAllRentsAsync(
            RentStatusFilter statusFilter = RentStatusFilter.All, int? userId = null)
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

        public async Task<WaitingList?> AddToWaitingListAsync(WaitingListCreateDto waitingListDto)
        {
            if (waitingListDto.UserId <= 0)
            {
                throw new ArgumentException("Invalid User ID provided.", nameof(waitingListDto.UserId));
            }

            if (waitingListDto.CarId <= 0)
            {
                throw new ArgumentException("Invalid Car ID provided.", nameof(waitingListDto.CarId));
            }

            var car = (await _unitOfWork.CarRepository.GetAsync(r => r.Id == waitingListDto.CarId)).FirstOrDefault();
            if (car == null)
            {
                throw new KeyNotFoundException($"Car with ID {waitingListDto.CarId} not found.");
            }

            if (!car.IsRented)
            {
                return null;
            }

            var existingWaitingEntry = (await _unitOfWork.WaitingListRepository.GetAsync(wl =>
                wl.CarId == waitingListDto.CarId &&
                wl.UserId == waitingListDto.UserId &&
                wl.Status == Status.Active
            )).FirstOrDefault();

            if (existingWaitingEntry != null)
            {
                return existingWaitingEntry;
            }

            var maxPosition = (await _unitOfWork.WaitingListRepository.GetAsync(wl => wl.CarId == waitingListDto.CarId
            )).Max(wl => (int?)wl.QueuePosition) ?? 0;

            var newWaitingListEntry = new WaitingList
            {
                UserId = waitingListDto.UserId,
                CarId = waitingListDto.CarId,
                QueuePosition = maxPosition + 1,
                QueuedAt = DateTime.UtcNow,
                Status = Status.Active,
            };

            await _unitOfWork.WaitingListRepository.InsertAsync(newWaitingListEntry);
            await _unitOfWork.SaveAsync();

            var user = (await _unitOfWork.UserRepository.GetAsync(u => u.Id == waitingListDto.UserId)).FirstOrDefault();
            if (user != null)
            {
                Console.WriteLine($"Attempting to send email to: '{user.Email}'.");
                if (string.IsNullOrWhiteSpace(user.Email))
                {
                    Console.WriteLine("User email is null or empty. Cannot send email.");
                }

                string subject = $"Sikeres feliratkozás várólistára: {car.Brand} {car.Model}";
                string body =
                    $"Tisztelt {user.FirstName} {user.LastName},\nÖn sikeresen feliratkozott a várólistára a következő autóra: <strong>{car.Brand} {car.Model} ({car.LicencePlate})</strong>.\n \nFeliratkozás időpontja: <strong>{newWaitingListEntry.QueuedAt:yyyy.MM.dd HH:mm:ss} (UTC)</strong>\nJelenlegi pozíciója a várólistán: <strong>{newWaitingListEntry.QueuePosition}</strong>\n \nÉrtesíteni fogjuk, amint az autó elérhetővé válik az Ön számára.\n \nÜdvözlettel,\nAz Ön autókölcsönző csapata";
                await _emailService.SendEmailAsync(user.Email, subject, body);
            }

            return newWaitingListEntry;
        }

        public async Task ProcessCarReturnForWaitingListAsync(int carId)
        {
            var car = (await _unitOfWork.CarRepository.GetAsync(c => c.Id == carId)).FirstOrDefault();
            if (car == null)
            {
                throw new KeyNotFoundException($"Car with ID {carId} not found.");
            }

            if (!car.InProperCondition)
            {
                throw new Exception("Car with ID " + carId + " does not have a proper condition.");
            }

            var nextInQueue =
                (await _unitOfWork.WaitingListRepository.GetAsync(wl =>
                        wl.CarId == carId &&
                        wl.Status == Status.Active &&
                        wl.NotifiedAt == null,
                    includeProperties: new[] { "User", "Car" }))
                .OrderBy(wl => wl.QueuePosition)
                .FirstOrDefault();

            if (nextInQueue != null)
            {
                string subject = $"Az autó elérhető: {nextInQueue.Car.Brand} {nextInQueue.Car.Model}";
                string body = $@"
                    Tisztelt {nextInQueue.User.FirstName} {nextInQueue.User.LastName},

                    Örömmel értesítjük, hogy a következő autó, amire várólistán szerepelt:
                    <strong>{nextInQueue.Car.Brand} {nextInQueue.Car.Model} ({nextInQueue.Car.LicencePlate})</strong> most elérhetővé vált az Ön számára!
                    <br><br>
                    Kérjük, foglalja le az autót a következő <strong>[időtartam, pl. 1 óra]</strong> órában. Ha nem él a lehetőséggel,
                    a várólista következő jelentkezője kapja meg az autó foglalásának lehetőségét.
                    <br><br>
                    Üdvözlettel,<br>
                    Az Ön autókölcsönző csapata
                ";
                await _emailService.SendEmailAsync(nextInQueue.User.Email, subject, body);

                nextInQueue.Status = Status.Notified;
                nextInQueue.QueuedAt = DateTime.UtcNow;

                await _unitOfWork.WaitingListRepository.UpdateAsync(nextInQueue);
                await _unitOfWork.SaveAsync();
            }
        }

        public async Task HandleRentCompletion(int rentId)
        {
            var completedRent = (await _unitOfWork.RentRepository.GetAsync(r => r.Id == rentId)).FirstOrDefault();

            if (completedRent != null && completedRent.CarId > 0)
            {
                var waitingListEntriesForCar =
                    await _unitOfWork.WaitingListRepository.GetAsync(wl =>
                        wl.CarId == completedRent.CarId &&
                        wl.Status == Status.Active || wl.Status == Status.Notified
                    );

                foreach (var entry in waitingListEntriesForCar)
                {
                    if (entry.UserId == completedRent.RenterId && entry.Status == Status.Notified)
                    {
                        entry.Status = Status.Booked;
                        await _unitOfWork.WaitingListRepository.UpdateAsync(entry);
                    }
                    else if (entry.Status == Status.Notified && entry.UserId != completedRent.RenterId)
                    {
                        entry.Status = Status.Canceled;
                        await _unitOfWork.WaitingListRepository.UpdateAsync(entry);
                    }
                }

                await _unitOfWork.SaveAsync();

                await ProcessCarReturnForWaitingListAsync(completedRent.CarId);
            }
        }

        public async Task<RentGetDto?> GetRentByCarId(int carId)
        {
            var rent = (await _unitOfWork.RentRepository.GetAsync(r => r.CarId == carId)).FirstOrDefault();
            if (rent == null)
            {
                return null;
            }

            return _mapper.Map<RentGetDto>(rent);
        }

        public async Task<IEnumerable<RentGetDto>> GetRentsByCarIdAsync(int carId)
        {
            string[] includeProps = { "Car", "Renter" };
            var rents = await _unitOfWork.RentRepository.GetAsync(r => r.CarId == carId,
                includeProperties: includeProps);


            return _mapper.Map<IEnumerable<RentGetDto>>(rents);
        }
    }
}