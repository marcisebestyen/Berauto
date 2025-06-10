using Database.Dtos.UserDtos;

namespace Database.Results;

public class LoginResult
{
    public bool Succeeded { get; private set; }
    public UserGetDto? User { get; private set; } // Sikeres bejelentkezés esetén a felhasználó adatai
    public string? Token { get; private set; } // JWT token tárolására
    public List<string> Errors { get; private set; } = new List<string>();

    public static LoginResult Success(UserGetDto user, string token) =>
        new LoginResult { Succeeded = true, User = user, Token = token };

    public static LoginResult Failure(params string[] errors) =>
        new LoginResult { Succeeded = false, Errors = errors.ToList() };
}