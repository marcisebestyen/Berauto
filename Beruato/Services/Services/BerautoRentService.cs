using Database.Data;
using Database.Models;
using AutoMapper;
using Database.Dtos;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Services.Services
{
    public interface IRentService
    {
        public Task<RentDto> CreateRent(CreateRentDto createRentDto);
        public Task<RentDto> ReturnRent(int rentId);
        public Task<List<RentListDto>> ListAllRents();
        public Task<RentDto> UpdateRent(UpdateRentDto updateRentDto, int rentId);
        public Task<RentDto> DeleteRent(int rentId);
    }

    public class BerautoRentService : IRentService
    {
        private readonly BerautoDbContext _context;
        private readonly IMapper _mapper;

        public BerautoRentService(BerautoDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<RentDto> CreateRent(CreateRentDto createRentDto)
        {
            var rent = _mapper.Map<Rent>(createRentDto);
            if (rent is null) 
            {
                throw new Exception("Rent is null");
            }
            await _context.Rents.AddAsync(rent);
            await _context.SaveChangesAsync();

            return _mapper.Map<RentDto>(rent);

        }

        public async Task<RentDto> ReturnRent(int rentId)
        {
            var rent = await _context.Rents.FirstOrDefaultAsync(r => r.Id == rentId);
            if (rent == null)
            {
                throw new Exception("Rent not found");
            }

            return _mapper.Map<RentDto>(rent);
        }

        public async Task<List<RentListDto>> ListAllRents()
        {
            return await _context.Rents.Select(r => _mapper.Map<RentListDto>(r)).ToListAsync();
        }

        public async Task<RentDto> UpdateRent(UpdateRentDto updateRentDto, int rentId)
        {
            var rent = await _context.Rents.FirstOrDefaultAsync(r => r.Id == rentId);
            var update = _mapper.Map<Rent>(updateRentDto);
            if (rent == null)
            {
                throw new Exception("Rent not found");
            }
            if (update.CarId != default)
            {
                rent.CarId = update.CarId;
            }
            if (update.StartDate != default)
            {
                rent.StartDate = update.StartDate;
            }
            if (update.EndDate != default)
            {
                rent.EndDate = update.EndDate;
            }

            await _context.SaveChangesAsync();
            return _mapper.Map<RentDto>(rent);
        }

        public async Task<RentDto> DeleteRent(int rentId)
        {
            var rent = await _context.Rents.FirstOrDefaultAsync(r => r.Id == rentId);
            if (rent == null)
            {
                throw new Exception("Rent not found");
            }
            _context.Rents.Remove(rent);
            await _context.SaveChangesAsync();
            return _mapper.Map<RentDto>(rent);
        }

        
    }
}
