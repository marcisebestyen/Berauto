using AutoMapper;
using Database.Models;
using Database.Dtos.CarDtos;
using Database.Dtos.ReceiptDtos;
using Database.Dtos.RentDtos;
using Database.Dtos.UserDtos;

namespace Services.Services;

public class MappingService : Profile
{
    public MappingService()
    {
        // User mappings
        
        CreateMap<User, UserGetDto>(); // A Name property a DTO-ban getter, AutoMapper kezeli ha FirstName, LastName mapelve van.
        CreateMap<User, UserSimpleGetDto>();
        
        CreateMap<UserCreateDto, User>();
        
        CreateMap<UserUpdateDto, User>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        
        //Car mappings
        
        CreateMap<Car,  CarGetDto>();
        CreateMap<Car, CarSimpleGetDto>();
        
        CreateMap<CarCreateDto, Car>()
            .ForMember(dest => dest.InProperCondition, opt => opt.MapFrom(src => true));
        
        CreateMap<CarUpdateDto, Car>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Rent mappings 

        CreateMap<Rent, RentGetDto>()
             .ForMember(dest => dest.ActualStart, opt => opt.MapFrom(src => src.ActualStart == DateTime.MinValue ? (DateTime?)null : src.ActualStart))
             .ForMember(dest => dest.ActualEnd, opt => opt.MapFrom(src => src.ActualEnd == DateTime.MinValue ? (DateTime?)null : src.ActualEnd))
             .ForMember(dest => dest.IssuedAt, opt => opt.MapFrom(src => src.IssuedAt == DateTime.MinValue ? (DateTime?)null : src.IssuedAt))
             .ForMember(dest => dest.RenterId, opt => opt.MapFrom(src => src.RenterId))
             .ForMember(dest => dest.CarId, opt => opt.MapFrom(src => src.CarId))             
             .ForMember(dest => dest.ApproverId, opt => opt.MapFrom(src => src.ApprovedBy))   
             .ForMember(dest => dest.IssuerId, opt => opt.MapFrom(src => src.IssuedBy))       
             .ForMember(dest => dest.RecipientId, opt => opt.MapFrom(src => src.TakenBackBy)); 
                                                                                              

        CreateMap<RentCreateDto, Rent>();
        
        CreateMap<RentUpdateByStaffDto, Rent>()
            .ForMember(dest => dest.ApprovedBy, opt => opt.MapFrom(src => src.ApprovedById))
            .ForMember(dest => dest.IssuedBy, opt => opt.MapFrom(src => src.IssuedById))
            .ForMember(dest => dest.TakenBackBy, opt => opt.MapFrom(src => src.TakenBackById))
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        
        // Receipt mappings 

        CreateMap<Receipt, ReceiptGetDto>();
        
        CreateMap<ReceiptCreateDto, Receipt>()
            .ForMember(dest => dest.IssuedBy, opt => opt.MapFrom(src => src.IssuedById));
        
        CreateMap<UpdateReceiptDto, Receipt>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}