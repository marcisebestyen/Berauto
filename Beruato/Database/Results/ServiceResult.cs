namespace Database.Results;

public class ServiceResult
{
    public bool Succeeded { get; protected set; }
    public List<string> Errors { get; protected set; } = new List<string>();

    public static ServiceResult Success() => new ServiceResult { Succeeded = true };
    public static ServiceResult Failed(params string[] errors) => new ServiceResult { Succeeded = false, Errors = errors.ToList() };
}