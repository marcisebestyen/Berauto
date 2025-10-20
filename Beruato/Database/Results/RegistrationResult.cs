using Database.Dtos.UserDtos;

namespace Database.Results;

public class RegistrationResult
{
    public bool Succeeded { get; private set; }
    public UserGetDto? User { get; private set; }
    public List<string> Errors { get; private set; } = new List<string>();

    public static RegistrationResult Success(UserGetDto userGetDto) => new() { Succeeded = true, User = userGetDto };

    public static RegistrationResult Failure(params string[] errors) =>
        new() { Succeeded = false, Errors = errors.ToList() };
}