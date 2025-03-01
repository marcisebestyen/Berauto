using Microsoft.AspNetCore.Mvc;
using Services.Services;

namespace Beruato.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class BerautoController : ControllerBase
{
   
    private readonly IBerautoService _berautoService;

    public BerautoController(IBerautoService berautoService)
    {
        _berautoService = berautoService;
    }

    [HttpGet]
    public IActionResult List()
    {
        var result = _berautoService.List();
        return Ok(result);
    }
}
