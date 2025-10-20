using Database.Data;
using Database.Models;

namespace Services.Repositories;

public interface IUnitOfWork : IDisposable
{
    IRepository<Car> CarRepository { get; }
    IRepository<Receipt> ReceiptRepository { get; }
    IRepository<Rent> RentRepository { get; }
    IRepository<User> UserRepository { get; }
    IRepository<WaitingList> WaitingListRepository { get; }
    IRepository<PasswordReset> PasswordResetRepository { get; }

    Task SaveAsync();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly BerautoDbContext _context;

    public IRepository<Car> CarRepository { get; set; }
    public IRepository<Receipt> ReceiptRepository { get; set; }
    public IRepository<Rent> RentRepository { get; set; }
    public IRepository<User> UserRepository { get; set; }
    public IRepository<WaitingList> WaitingListRepository { get; set; }
    public IRepository<PasswordReset> PasswordResetRepository { get; set; }

    public UnitOfWork(BerautoDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        CarRepository = new Repository<Car>(_context);
        ReceiptRepository = new Repository<Receipt>(_context);
        RentRepository = new Repository<Rent>(_context);
        UserRepository = new Repository<User>(_context);
        WaitingListRepository = new Repository<WaitingList>(_context);
        PasswordResetRepository = new Repository<PasswordReset>(_context);
    }

    public async Task SaveAsync()
    {
        await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}