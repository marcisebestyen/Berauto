using AutoMapper;
using Database.Dtos;
using Database.Models;

namespace Services.Services
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            // Car <-> DTO
            CreateMap<Car, CarDto>()
                .ForMember(dest => dest.Licence, opt => opt.MapFrom(src => src.Licence.ToString()))
                .ForMember(dest => dest.FuelType, opt => opt.MapFrom(src => src.FuelType.ToString()));
            CreateMap<CreateCarDto, CarDto>();
            CreateMap<UpdateCarDto, Car>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<Car, ListCarDto>();

            // User <-> DTO
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address));
            CreateMap<CreateUserDto, User>();
            CreateMap<UpdateUserDto, User>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<User, ListUserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"));

            // Address <-> DTO
            CreateMap<Address, AddressDto>()
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => $"{src.ZipCode} {src.Settlement} {src.Street} {src.HouseNumber}"));
            CreateMap<CreateAddressDto, Address>();
            CreateMap<UpdateAddressDto, Address>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<Address, ListAddressDto>()
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => $"{src.ZipCode} {src.Settlement} {src.Street} {src.HouseNumber}"));

            // Rent <-> DTO
            CreateMap<Rent, RentDto>();
            CreateMap<CreateRentDto, Rent>();
            CreateMap<UpdateRentDto, Rent>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<Rent, ListRendDto>()
                .ForMember(dest => dest.CarModel, opt => opt.MapFrom(src => src.Car.Model))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => $"{src.User.FirstName} {src.User.LastName}"));
        }
    }
}
