using Database.Models;
using System;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Database.Dtos
{


    public class CarDto
    {
        public bool IsAvailable { get; set; }
        public RequiredLicence Licence { get; set; }
        public string Brand { get; set; }
        public string Model { get; set; }
        public string LicencePlate { get; set; }
        public bool HaveValidVignette { get; set; }
        public decimal Price { get; set; }
        public int Seats { get; set; }
        public FuelType FuelType { get; set; }
        public bool IsAutomaticTransmission { get; set; }
        public double Trunk { get; set; }

    }
    public class CarUpdateDTO
    {
        public bool? IsAvailable { get; set; }
        public RequiredLicence? Licence { get; set; }
        public string Brand { get; set; }
        public string Model { get; set; }
        public string LicencePlate { get; set; }
        public bool? HaveValidVignette { get; set; }
        public decimal? Price { get; set; }
        public int? EngineSize { get; set; }
        public int? HorsePower { get; set; }
        public int? Seats { get; set; }
        public FuelType? FuelType { get; set; }
        public bool? IsAutomaticTransmission { get; set; }
        public double? Trunk { get; set; }


       
    }
}