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

        public BerautoDbContext(DbContextOptions<BerautoDbContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            //string connectionString = "Server=ROMEOPC;Database=BerautoDb;TrustServerCertificate=True;Trusted_Connection=True"; // romeo
            string connectionString = "Server=localhost\\SQLEXPRESS;Database=BerautoDb;TrustServerCertificate=True;Trusted_Connection=True"; // mate

            //string connectionString = "Server=localhost;Database=BerautoTestDb;TrustServerCertificate=True;User Id=sa;Password=yourStrong(&)Password"; // sebi

            optionsBuilder.UseSqlServer(connectionString);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.UserName).IsRequired().HasMaxLength(100); // adminoknak, staffoknak
                entity.HasIndex(e => e.UserName).IsUnique();

                entity.Ignore(e => e.Name);

                entity.Property(e => e.PhoneNumber).HasMaxLength(30);
                entity.Property(e => e.LicenceId).HasMaxLength(30);

                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.Password).HasMaxLength(255);

                entity.HasIndex(e => e.Email).IsUnique().HasFilter("[Email] IS NOT NULL");
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
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

                entity.Property(e => e.LicencePlate).IsRequired().HasMaxLength(15);
                entity.HasIndex(e => e.LicencePlate).IsUnique();

                entity.Property(e => e.PricePerKilometer).IsRequired().HasColumnType("decimal(18, 2)");
                entity.Property(e => e.ActualKilometers).IsRequired().HasColumnType("decimal(18, 2)");

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
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.IssuerOperator)
                    .WithMany()
                    .HasForeignKey(r => r.IssuedBy)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.RecipientOperator)
                    .WithMany()
                    .HasForeignKey(r => r.TakenBackBy)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(r => r.StartingKilometer).IsRequired().HasColumnType("decimal(18, 2)");

                entity.Property(r => r.EndingKilometer).IsRequired().HasColumnType("decimal(18, 2)");
            });

            modelBuilder.Entity<Receipt>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(rec => rec.TotalCost).IsRequired().HasColumnType("decimal(18, 2)");

                entity.HasOne(rec => rec.Rent)
                    .WithOne()
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

/*
 * alap funkciók:
 * => autó leadása
 * => autó átadása az ügyfélnek
 * => igény rögzítése, kölcsönző regisztrált vagy nem?
 *      ha nem, funkció -> alap adatok rögzítése
 * => számla kiállítása
 *
 * => igénylés:
 *      ki? mit? mikor? meddig? számlaigényt kitölteni ott helyben
 * => autó átadás:
 *      mikor? hány km-rel?
 * => autó leadás:
 *      mikor? hány km-rel?
 * => számla:
 *      Rent-be számlaId átadva = true
 *
 * admin jogok:
 * => autó km óra átállítása db-ben
 * => új autó felvétele, updateje, törlés
 * => autó adatok megtekintése
 *
 * ügyintéző jogok:
 * => igény engedélyezése
 * => autó atadás/visszavétel igazolása
 * => autó átadás rögzítése
 * => kölcsönzés és kölcsönzési igények history megtekintése
 * => számla kiállítása
 *
 * user jogok:
 * => regisztráció, login
 * => adataik megnézése
 * => autó adatok megtekintése
 * => igény leadása (csak szabad autó)
 * => előzmények megtekintése (regisztrált usereknek)
 * => számla igénylése (rentId leadása, abból visszafejtett adatok)
 *
 *
 * // admin = adminisztrátor,
 * // ügyintéző = aki a rendelést felveszi,
 * // user = kishal
 *
 * új igény leadásának menete:
 * -login/regisztráció/guest => rákényszerítés a választásra, csak rentereknek
 * -ha guest => adatok megadása
 * -login => operátor/user (username/email)
 * -regisztráció => regisztráció fül
 * -időpontok megadása
 * -autóválasztás (csak nem foglalt, és műszakilag megfelelő)
 * -számlaigény (igen/nem)
 * -mentés
 *
 * igény engedélyezés menete:
 * -lista a nem engedélyezettekről
 * -engedélyezés function (id alapján igen/nem)
 *
 * kiadás menete:
 * -rendelés megkeresése
 * rögzítjük az induló km-t, és a kiadó operátort
 *
 * visszavétel menete:
 * -rendelés megkeresése
 * -rögzíjük az aktuális km-t, és a visszavevő operátort
 *
 * számla elkészítése:
 * -rendelés keresése
 * -záró-induló km * autó km-kénti ára
 *
 * autó adatok karbantartása:
 * -km módosítás
 * -műszaki állapot
 * -új autó felvitele
 *
 * kölcsönzések, igénylések history:
 * -szűrőopciók (nyitott, lezárt, futó, all), majd listázás
 *
 * !!!nagyjából súly szerint szétszedni, hogy ki-mit csinál, majd egy dto igényeket leadni, és backend kiszolgálásokat megcsinálni!!!
 */