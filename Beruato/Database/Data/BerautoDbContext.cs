﻿using Database.Models;
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

        public BerautoDbContext(DbContextOptions<BerautoDbContext> options) : base(options) { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string connectionString = "Server=localhost\\SQLEXPRESS;Database=BerautoDb;TrustServerCertificate=True;Trusted_Connection=True"; // mate

            //string connectionString = "Server=localhost;Database=BerautoDb;TrustServerCertificate=True;User Id=sa;Password=yourStrong(&)Password"; // sebi

            optionsBuilder.UseSqlServer(connectionString);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Rent>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.NoAction);


            base.OnModelCreating(modelBuilder);
        }
    }
}
