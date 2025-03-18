using Database.Data;
using Database.Models;
using AutoMapper;
using Database.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Services.Services
{
    public interface IAddrssService
    {
        public Task<AddressDto> CreateAddress(CreateAddressDto createAddressDto);
        public Task<AddressDto> UpdateAddress(UpdateAddressDto updateAddressDto, int addressId);
        public Task<AddressDto> DeleteAddress(int addressId);
        public Task<AddressDto> GetAddress(int addressId);
    }

    public class AddressService : IAddrssService
    {
        readonly BerautoDbContext _context;
        readonly IMapper _mapper;
        public AddressService(BerautoDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }


        public async Task<AddressDto> CreateAddress(CreateAddressDto createAddressDto)
        {
            var address = _mapper.Map<Address>(createAddressDto);
            if (address is null)
            {
                throw new Exception("Address is null");
            }
            await _context.Addresses.AddAsync(address);
            await _context.SaveChangesAsync();
            return _mapper.Map<AddressDto>(address);
        }

        public async Task<AddressDto> DeleteAddress(int addressId)
        {
            var address = await _context.Addresses.FirstOrDefaultAsync(x => x.Id == addressId);
            if (address == null)
            {
                throw new Exception("Address not found");
            }

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();
            return _mapper.Map<AddressDto>(address);
        }

        public async Task<AddressDto> GetAddress(int addressId)
        {
            var address = await _context.Addresses.FirstOrDefaultAsync(x => x.Id == addressId);
            if (address == null)
            {
                throw new Exception("Address not found");
            }
            return _mapper.Map<AddressDto>(address);
        }

        public async Task<AddressDto> UpdateAddress(UpdateAddressDto updateAddressDto, int addressId)
        {
            var address = await _context.Addresses.FirstOrDefaultAsync(x => x.Id == addressId);
            var updatedAddress = _mapper.Map(updateAddressDto, address);
            if (address == null)
            {
                throw new Exception("Address not found");
            }

            foreach (var prop in typeof(Address).GetProperties())
            {
                var updatedValue = prop.GetValue(updatedAddress);
                if (updatedValue != null)
                {
                    prop.SetValue(address, updatedValue);
                }
            }
            await _context.SaveChangesAsync();
            return _mapper.Map<AddressDto>(address);
        }
    }
}
