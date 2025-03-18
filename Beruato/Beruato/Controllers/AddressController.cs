using Microsoft.AspNetCore.Mvc;
using Database.Dtos;
using Services.Services;

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
