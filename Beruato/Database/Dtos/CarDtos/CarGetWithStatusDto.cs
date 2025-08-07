using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Database.Dtos.CarDtos
{
    public enum CarAvailabilityStatus
    {
        Available,
        Rented,
        NotProperCondition,
        Deleted
    }

    public class CarGetWithStatusDto : CarGetDto
    {
        public CarAvailabilityStatus Status { get; set; }
    }
}
