using Microsoft.AspNetCore.Mvc;
using Database.Dtos;
using Services.Services;
using Microsoft.AspNetCore.Authorization;

namespace Beruato.Controllers
{
    [ApiController]
    [Route("[controller]/[action]")]
    public class AddressController : ControllerBase
    {
        private readonly IAddrssService _addressService;

        public AddressController(IAddrssService addressService)
        {
            _addressService = addressService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin, User, Director, Guest")]
        public async Task<IActionResult> CreateAddress([FromBody] CreateAddressDto addressDto)
        {
            try
            {
                var address = await _addressService.CreateAddress(addressDto);
                return Ok(address);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpDelete]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> DeleteAddress([FromBody] int addressId)
        {
            try
            {
                var address = await _addressService.DeleteAddress(addressId);
                return Ok(address);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> GetAddress([FromBody] int addressId)
        {
            try
            {
                var address = await _addressService.GetAddress(addressId);
                return Ok(address);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPut]
        [Authorize(Roles = "Admin, Director, User")]
        public async Task<IActionResult> UpdateAddress([FromBody] UpdateAddressDto updateAddressDto, int addressId)
        {
            try
            {
                var address = await _addressService.UpdateAddress(updateAddressDto, addressId);
                return Ok(address);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
       

    }
}
