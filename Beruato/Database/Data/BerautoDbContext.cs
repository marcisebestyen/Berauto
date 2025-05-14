using Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Database.Data
{
    public class BerautoDbContext : DbContext
    {
        public DbSet<Car> Cars { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Rent> Rents { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Receipt> Receipts { get; set; }
        public DbSet<Role> Roles { get; set; }

        public BerautoDbContext(DbContextOptions<BerautoDbContext> options) : base(options) { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string connectionString = "Server=ROMEOPC;Database=BerautoDb;TrustServerCertificate=True;Trusted_Connection=True"; // romeo
            //string connectionString = "Server=localhost\\SQLEXPRESS;Database=BerautoDb;TrustServerCertificate=True;Trusted_Connection=True"; // mate

            //string connectionString = "Server=localhost;Database=BerautoDb;TrustServerCertificate=True;User Id=sa;Password=yourStrong(&)Password"; // sebi

            optionsBuilder.UseSqlServer(connectionString);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.UserName).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();

                entity.HasOne(u => u.Address)
                      .WithMany()
                      .HasForeignKey(u => u.AddressId)
                      .IsRequired()
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(u => u.Roles)
                      .WithMany(r => r.Users)
                      .UsingEntity(j => j.ToTable("UserRoles"));

                // Note: Configuration for List<string> PhoneNumber depends on how EF Core mapped it.
                // If it's a single column, potentially add:
                // entity.Property("PhoneNumber").HasMaxLength(50); // Example if EF mapped it to a column named "PhoneNumber"
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasIndex(r => r.Name).IsUnique();
            });

            modelBuilder.Entity<Car>(entity =>
            {
                entity.HasIndex(c => c.LicencePlate).IsUnique();
                entity.Property(c => c.Licence).HasConversion<int>();
                entity.Property(c => c.FuelType).HasConversion<int>();
                entity.Property(c => c.Price).HasPrecision(18, 2);
                entity.Property(c => c.Trunk).HasPrecision(10, 2);
            });

            modelBuilder.Entity<Rent>(entity =>
            {
                entity.HasOne(r => r.Car)
                      .WithMany()
                      .HasForeignKey(r => r.CarId)
                      .IsRequired()
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.User)
                      .WithMany()
                      .HasForeignKey(r => r.UserId)
                      .IsRequired()
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Administrator)
                      .WithMany()
                      .HasForeignKey(r => r.AdministratorId)
                      .IsRequired()
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Receipt>(entity =>
            {
                entity.Property(r => r.Cost).HasPrecision(18, 2);

                entity.HasOne(rec => rec.Rent)
                      .WithOne()
                      .HasForeignKey<Receipt>(rec => rec.RentId)
                      .IsRequired()
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Address>(entity =>
            {
                entity.Property(a => a.ZipCode).HasMaxLength(20);
                entity.Property(a => a.Country).HasMaxLength(100);
                // ... etc
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
