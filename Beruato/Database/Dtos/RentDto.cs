using Database.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Database.Dtos
{
    public class RentDto
    {
        public int Id { get; set; }
        public int CarId { get; set; }
        public int UserId { get; set; }
        public int AdministratorId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool Finished { get; set; }

        
    }

    public class CreateRentDto
    {
        public int CarId { get; set; }
        public int UserId { get; set; }
        public int AdministratorId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
    public class UpdateRentDto
    {
        public int? CarId { get; set; }
        public int? AdministratorId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        
    }

    public class RentListDto
    {
        public int Id { get; set; }
        public string CarModel { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool Finished { get; set; }
    }



}
