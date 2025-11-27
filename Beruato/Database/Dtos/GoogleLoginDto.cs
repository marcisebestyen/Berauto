using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Database.Dtos
{
    public class GoogleLoginDto
    {
        [Required(ErrorMessage = "A Google token megadása kötelező.")]
        public string AccessToken { get; set; }
    }
}
