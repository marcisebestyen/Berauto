namespace Database.Models;

public class PasswordReset
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime ExpiredAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public bool IsRevoked { get; set; }

    public int UserId { get; set; }

    public User User { get; set; }
}