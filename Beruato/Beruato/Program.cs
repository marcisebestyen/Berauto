using Database.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Services.Repositories;
using Services.Services;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Services.Configurations;


namespace Beruato
{
    public class Program
    {
        public static void Main(string[] args)
        {
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
            var builder = WebApplication.CreateBuilder(args);

            var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

            builder.Services.AddControllers();
            builder.Services.AddControllers().AddNewtonsoftJson();
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy(name: MyAllowSpecificOrigins,
                    policy =>
                    {
                        policy.WithOrigins("http://localhost:7285")
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                            .AllowCredentials();
                    });
            });

            builder.Services.AddOpenApi();
            builder.Services.AddDbContext<BerautoDbContext>(options =>
                options.UseSqlServer(builder.Configuration
                        .GetConnectionString(
                            "Mark"), b => b.MigrationsAssembly("Beruato")));

            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
            builder.Services.AddScoped<ICarService, CarService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IRentService, RentService>();
            builder.Services.AddScoped<IStaffService, StaffService>();
            builder.Services.AddScoped<IReceiptService, ReceiptService>();
            builder.Services.AddScoped<IInvoicePdfService, InvoicePdfService>();
            builder.Services.AddScoped<IEmailService, EmailService>();

            builder.Services.Configure<Services.Configurations.MailSettings>(
            builder.Configuration.GetSection("MailtrapSettings"));

            var jwtSettings = builder.Configuration.GetSection("Jwt");
            var secretKey = jwtSettings["Key"];

            builder.Services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtSettings["Issuer"],
                        ValidAudience = jwtSettings["Audience"],
                        IssuerSigningKey =
                            new SymmetricSecurityKey(Encoding.UTF8
                                .GetBytes(secretKey ?? throw new InvalidOperationException("JWT key not configured"))),

                        RoleClaimType = ClaimTypes.Role,
                        NameClaimType = ClaimTypes.NameIdentifier
                    };
                });
            
            builder.Services.AddAuthorization();

            // builder.Services.AddAuthorization(options =>
            // {
            //     options.AddPolicy("GuestPolicy", policy => policy.RequireRole("Guest"));
            //     options.AddPolicy("AdminPolicy", policy => policy.RequireRole("Admin"));
            //     options.AddPolicy("UserPolicy", policy => policy.RequireRole("User"));
            //     options.AddPolicy("DirectorPolicy", policy => policy.RequireRole("Director"));
            // });

            builder.Services.AddAutoMapper(typeof(Services.Services.MappingService).Assembly);

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Berauto API", Version = "v1" });

                //swagger xml file
                var servicesAssemblyXmlFile = $"{typeof(Services.Services.MappingService).Assembly.GetName().Name}.xml";
                var servicesAssemblyXmlPath = Path.Combine(AppContext.BaseDirectory, servicesAssemblyXmlFile);
                if (File.Exists(servicesAssemblyXmlPath))
                {
                    c.IncludeXmlComments(servicesAssemblyXmlPath);
                }

                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    In = ParameterLocation.Header,
                    Description = "Please insert JWT token",
                    Name = "Authorization",
                    Type = SecuritySchemeType.ApiKey,
                    BearerFormat = "JWT",
                    Scheme = "Bearer"
                });
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] { }
                    }
                });
            });
            
            builder.Services.Configure<MailSettings>(builder.Configuration.GetSection("MailSettings"));

            builder.Services.AddTransient<IEmailService, EmailService>();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Berauto API v1"));
            }

            app.UseHttpsRedirection();

            app.UseCors(MyAllowSpecificOrigins);

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}