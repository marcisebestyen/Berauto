namespace Database.Results;

public class CreateResult<T> where T : class
{
    public bool Succeeded { get; set; }
    public T? Resource { get; set; }
    public List<string> Errors { get; set; } = new List<string>();

    public static CreateResult<T> Success(T resource) => new CreateResult<T> { Succeeded = true, Resource = resource };

    public static CreateResult<T> Failure(params string[] errors) =>
        new CreateResult<T> { Succeeded = false, Errors = errors.ToList() };
}