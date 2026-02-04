using Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Database.Data
{
    public class BerautoDbContext : DbContext
    {
        public DbSet<Car> Cars { get; set; }
        public DbSet<Receipt> Receipts { get; set; }
        public DbSet<Rent> Rents { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Faq> Faqs { get; set; }
        public DbSet<PasswordReset> PasswordResets { get; set; }
        public DbSet<Depot> Depots { get; set; }
        public DbSet<WaitingList> WaitingLists { get; set; }

        public BerautoDbContext(DbContextOptions<BerautoDbContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PasswordReset>(password =>
            {
                password.HasKey(pr => pr.Id); // PK 

                password.HasIndex(pr => pr.Token)
                    .IsUnique(); // index, business ID, every token must be unique
                password.Property(pr => pr.Token)
                    .HasMaxLength(256)
                    .IsRequired();

                // foreign key setting
                password.HasOne(pr => pr.User)
                    .WithMany()
                    .HasForeignKey(pr => pr.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.FirstName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.LastName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.UserName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasIndex(e => e.UserName)
                    .IsUnique();

                entity.Ignore(e => e.Name);

                entity.Property(e => e.PhoneNumber)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.Property(e => e.LicenceId)
                    .HasMaxLength(30);

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.Password)
                    .HasMaxLength(255);

                entity.HasIndex(e => e.Email)
                    .IsUnique()
                    .HasFilter("\"Email\" IS NOT NULL");
            });

            modelBuilder.Entity<Car>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.FuelType)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.RequiredLicence)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.LicencePlate)
                    .IsRequired()
                    .HasMaxLength(15);

                entity.HasIndex(e => e.LicencePlate)
                    .IsUnique();

                entity.Property(e => e.PricePerDay)
                    .IsRequired()
                    .HasColumnType("numeric(18, 2)");

                entity.Property(e => e.ActualKilometers)
                    .IsRequired()
                    .HasColumnType("numeric(18, 2)");

                entity.Property(e => e.Brand)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Model)
                    .IsRequired()
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<Rent>(entity =>
            {
                entity.HasKey(e => e.Id);


                entity.HasOne(r => r.Renter)
                    .WithMany()
                    .HasForeignKey(r => r.RenterId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Car)
                    .WithMany()
                    .HasForeignKey(r => r.CarId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);


                entity.HasOne(r => r.ApproverOperator)
                    .WithMany()
                    .HasForeignKey(r => r.ApprovedBy)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);


                entity.HasOne(r => r.IssuerOperator)
                    .WithMany()
                    .HasForeignKey(r => r.IssuedBy)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);


                entity.HasOne(r => r.RecipientOperator)
                    .WithMany()
                    .HasForeignKey(r => r.TakenBackBy)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(r => r.StartingKilometer)
                    .HasColumnType("numeric(18, 2)");

                entity.Property(r => r.EndingKilometer)
                    .HasColumnType("numeric(18, 2)");

                entity.Property(r => r.InvoiceRequest)
                    .IsRequired();

                entity.HasIndex(r => r.ReceiptId)
                    .IsUnique(true)
                    .HasFilter("\"ReceiptId\" IS NOT NULL");


                entity.Property(r => r.TotalCost)
                    .HasColumnType("numeric(18,2)");

            });

            modelBuilder.Entity<Receipt>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(rec => rec.TotalCost)
                    .IsRequired()
                    .HasColumnType("numeric(18, 2)");

                entity.HasOne(rec => rec.Rent)
                    .WithOne(r => r.Receipt)
                    .HasForeignKey<Receipt>(rec => rec.RentId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(rec => rec.IssuerOperator)
                    .WithMany()
                    .HasForeignKey(rec => rec.IssuedBy)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
