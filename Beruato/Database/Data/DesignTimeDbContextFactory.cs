using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Database.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<BerautoDbContext>
{
    public BerautoDbContext CreateDbContext(string[] args)
    {
        IConfigurationRoot configuration = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory()))
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();
        
        var connectionString = configuration.GetConnectionString("Mark");

        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("Connection string not found");
        }

        var builder = new DbContextOptionsBuilder<BerautoDbContext>();
        builder.UseSqlServer(connectionString);
        return new BerautoDbContext(builder.Options);
    }
}