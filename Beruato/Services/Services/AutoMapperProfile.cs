using AutoMapper;
using Database.Dtos;
using Database.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            //Car mapping
            CreateMap<CarDto, Car>().ReverseMap();
            CreateMap<Car, CarDto>();

            //user <->dto
            //createmap<user, userdto>()
            //    .formember(dest => dest.fullname, opt => opt.mapfrom(src => $"{src.firstname} {src.lastname}"))
            //    .formember(dest => dest.address, opt => opt.mapfrom(src => src.address));
            //createmap<createuserdto, user>();
            //createmap<updateuserdto, user>()
            //    .forallmembers(opts => opts.condition((src, dest, srcmember) => srcmember != null));
            //createmap<user, userlistdto>()
            //    .formember(dest => dest.fullname, opt => opt.mapfrom(src => $"{src.firstname} {src.lastname}"));

            //// address <-> dto
            //createmap<address, addressdto>();
            //createmap<createaddressdto, address>();
            //createmap<updateaddressdto, address>()
            //    .forallmembers(opts => opts.condition((src, dest, srcmember) => srcmember != null));
            //createmap<address, addresslistdto>();

        }
    }
}
