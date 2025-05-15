-- =============================================
-- Sample Data Insertion Script
-- Assumes tables created by EF Core Migrations
-- Uses SQL Server syntax for IDENTITY_INSERT
-- Assumes PhoneNumber IS A SINGLE STRING COLUMN (e.g., NVARCHAR) in the Users table
-- Uses the same BCrypt hash for all user passwords ("almafa123")
-- =============================================

-- Enable explicit ID insertion for Addresses
SET IDENTITY_INSERT dbo.Addresses ON;

-- Insert Sample Addresses
INSERT INTO dbo.Addresses (Id, ZipCode, Country, County, Settlement, Street, HouseNumber, Floor, Door) VALUES
(1, '8200', 'Hungary', 'Veszprém', 'Veszprém', 'Egyetem utca', '10', NULL, NULL),
(2, '1054', 'Hungary', 'Budapest', 'Budapest', 'Kossuth Lajos tér', '1-3', '2', '5'),
(3, '4032', 'Hungary', 'Hajdú-Bihar', 'Debrecen', 'Egyetem sugárút', '1', NULL, NULL),
(4, '6720', 'Hungary', 'Csongrád-Csanád', 'Szeged', 'Dóm tér', '5', '1', 'A'),
(5, '7621', 'Hungary', 'Baranya', 'Pécs', 'Rákóczi út', '22', NULL, NULL),
(6, '9021', 'Hungary', 'Gyõr-Moson-Sopron', 'Gyõr', 'Széchenyi tér', '7', '3', '12B'),
(7, '1111', 'Hungary', 'Budapest', 'Budapest', 'Mûegyetem rakpart', '3', 'GF', '2'),
(8, '3530', 'Hungary', 'Borsod-Abaúj-Zemplén', 'Miskolc', 'Szent István út', '15', NULL, NULL),
(9, '8000', 'Hungary', 'Fejér', 'Székesfehérvár', 'Fõ utca', '8', '2', '4C');

-- Disable explicit ID insertion for Addresses
SET IDENTITY_INSERT dbo.Addresses OFF;


-- Enable explicit ID insertion for Roles (Optional if already seeded by EF)
SET IDENTITY_INSERT dbo.Roles ON;

-- Insert Sample Roles (Assuming IDs 1, 2, 3, 4)
-- Make sure these match the names used in your C# code logic
INSERT INTO dbo.Roles (Id, Name) VALUES
(1, 'Guest'),    -- Assuming ID 1
(2, 'User'),     -- Assuming ID 2
(3, 'Admin'),    -- Assuming ID 3
(4, 'Director'); -- Assuming ID 4

-- Disable explicit ID insertion for Roles
SET IDENTITY_INSERT dbo.Roles OFF;


-- Enable explicit ID insertion for Users
SET IDENTITY_INSERT dbo.Users ON;

-- Insert Sample Users
-- Password hash for "almafa123": $2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.
-- IMPORTANT: The PhoneNumber column below MUST be a string type (e.g., NVARCHAR) in your database table.
INSERT INTO dbo.Users (Id, UserName, FirstName, LastName, Email, Password, PhoneNumber, AddressId) VALUES
(1, 'admin_user', 'Ad', 'Min', 'admin@berauto.test', '$2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.', '+36301112233', 1),
(2, 'test_user_elek', 'Elek', 'Teszt', 'test.elek@berauto.test', '$2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.', '+36207778899', 2),
(3, 'director_user', 'Dir', 'Ektor', 'director@berauto.test', '$2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.', '+36709990011', 3),
(4, 'anna_kovacs', 'Anna', 'Kovács', 'anna.kovacs@berauto.test', '$2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.', '+36201234567', 4),
(5, 'peter_nagy', 'Péter', 'Nagy', 'peter.nagy@berauto.test', '$2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.', '+36705551234', 5),
(6, 'zsofia_kiss', 'Zsófia', 'Kiss', 'zsofia.kiss@berauto.test', '$2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.', '+36208887766', 6),
(7, 'laszlo_feher', 'László', 'Fehér', 'laszlo.feher@berauto.test', '$2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.', '+36301212121', 7),
(8, 'edit_vamos', 'Edit', 'Vámos', 'edit.vamos@berauto.test', '$2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.', '06309876543', 8), -- Example without '+'
(9, 'geza_balogh', 'Géza', 'Balogh', 'geza.balogh@berauto.test', '$2a$11$Yj7U.vAlnrczdOxT7jWNpuLIywZNnN3GUKkTGkbG45vG2M86VuRr.', '+36701122334', 9);

-- Disable explicit ID insertion for Users
SET IDENTITY_INSERT dbo.Users OFF;


-- Insert UserRoles (Link Users to Roles - No IDENTITY_INSERT needed)
-- Assumes Role IDs: 1=Guest, 2=User, 3=Admin, 4=Director
INSERT INTO dbo.UserRoles (UsersId, RolesId) VALUES
(1, 3), -- admin_user has Admin role
(1, 2), -- admin_user also has User role
(2, 2), -- test_user_elek has User role
(3, 4), -- director_user has Director role
(3, 3), -- director_user also has Admin role
(3, 2), -- director_user also has User role
(4, 2), -- anna_kovacs has User role
(5, 2), -- peter_nagy has User role
(5, 1), -- peter_nagy also has Guest role
(6, 3), -- zsofia_kiss has Admin role
(6, 2), -- zsofia_kiss also has User role
(7, 2), -- laszlo_feher has User role
(8, 2), -- edit_vamos has User role
(9, 1), -- geza_balogh has Guest role
(9, 2); -- geza_balogh also has User role


-- Enable explicit ID insertion for Cars
SET IDENTITY_INSERT dbo.Cars ON;

-- Insert Sample Cars
-- Licence Enum: 0=AM, 1=A1, 2=A2, 3=A, 4=B (from your C# enum)
-- FuelType Enum: 0=Diesel, 1=Petrol, 2=Hybrid, 3=Electric (from your C# enum)
INSERT INTO dbo.Cars (Id, IsAvailable, Licence, Brand, Model, LicencePlate, HaveValidVignette, Price, Seats, FuelType, IsAutomaticTransmission, Trunk) VALUES
(1, 1, 4, 'Toyota', 'Corolla', 'ABC-123', 1, 150.00, 5, 2, 1, 450.50),
(2, 1, 4, 'Volkswagen', 'Golf', 'DEF-456', 0, 120.00, 5, 0, 0, 380.00),
(3, 0, 4, 'Suzuki', 'Swift', 'GHI-789', 1, 80.00, 4, 1, 0, 265.00),
(4, 1, 4, 'Tesla', 'Model 3', 'JKL-012', 1, 250.00, 5, 3, 1, 542.00),
(5, 1, 4, 'BMW', '3 Series', 'MNO-345', 1, 220.00, 5, 1, 1, 480.00),
(6, 1, 4, 'Audi', 'A4', 'PQR-678', 1, 210.00, 5, 0, 1, 460.00),
(7, 0, 4, 'Ford', 'Focus', 'STU-901', 0, 100.00, 5, 1, 0, 375.00),
(8, 1, 4, 'Mercedes-Benz', 'C-Class', 'VWX-234', 1, 230.00, 5, 2, 1, 455.00),
(9, 1, 0, 'Renault', 'Twizy', 'YZA-567', 1, 50.00, 2, 3, 1, 31.00),
(10, 1, 4, 'Kia', 'Sportage', 'BCD-890', 1, 170.00, 5, 1, 0, 491.00),
(11, 1, 4, 'Hyundai', 'Tucson', 'EFG-112', 1, 160.00, 5, 2, 1, 513.00),
(12, 0, 4, 'Peugeot', '208', 'HIJ-334', 1, 90.00, 5, 1, 0, 285.00),
(13, 1, 4, 'Skoda', 'Octavia', 'KLM-556', 0, 130.00, 5, 0, 0, 600.00),
(14, 1, 4, 'Volvo', 'XC40', 'NOP-778', 1, 200.00, 5, 3, 1, 452.00);

-- Disable explicit ID insertion for Cars
SET IDENTITY_INSERT dbo.Cars OFF;


-- Enable explicit ID insertion for Rents
SET IDENTITY_INSERT dbo.Rents ON;

-- Insert Sample Rents
-- Ensure AdministratorId refers to users with Admin/Director roles (e.g., User 1, 3, 6)
INSERT INTO dbo.Rents (Id, CarId, UserId, AdministratorId, StartDate, EndDate, Finished) VALUES
(1, 2, 2, 1, DATEADD(day, -15, GETDATE()), DATEADD(day, -12, GETDATE()), 1),
(2, 4, 3, 1, DATEADD(day, -10, GETDATE()), DATEADD(day, -3, GETDATE()), 1),
(3, 1, 2, 3, DATEADD(day, -2, GETDATE()), DATEADD(day, 1, GETDATE()), 0),
(4, 5, 4, 6, DATEADD(day, -1, GETDATE()), DATEADD(day, 5, GETDATE()), 0),
(5, 6, 5, 1, GETDATE(), DATEADD(day, 7, GETDATE()), 0),
(6, 8, 7, 3, DATEADD(day, 1, GETDATE()), DATEADD(day, 4, GETDATE()), 0),
(7, 10, 4, 6, DATEADD(day, -20, GETDATE()), DATEADD(day, -15, GETDATE()), 1),
(8, 9, 5, 1, DATEADD(day, -7, GETDATE()), DATEADD(day, -5, GETDATE()), 1),
(9, 11, 8, 6, DATEADD(day, -25, GETDATE()), DATEADD(day, -22, GETDATE()), 1),
(10, 12, 9, 3, DATEADD(day, -30, GETDATE()), DATEADD(day, -28, GETDATE()), 1),
(11, 13, 4, 1, DATEADD(day, -3, GETDATE()), DATEADD(day, 2, GETDATE()), 0),
(12, 14, 7, 6, DATEADD(day, 0, GETDATE()), DATEADD(day, 10, GETDATE()), 0),
(13, 3, 2, 3, DATEADD(day, -40, GETDATE()), DATEADD(day, -35, GETDATE()), 1), -- Car 3 is unavailable, but rent is in the past
(14, 7, 5, 1, DATEADD(day, -50, GETDATE()), DATEADD(day, -45, GETDATE()), 1); -- Car 7 is unavailable, but rent is in the past


-- Disable explicit ID insertion for Rents
SET IDENTITY_INSERT dbo.Rents OFF;


-- Enable explicit ID insertion for Receipts
SET IDENTITY_INSERT dbo.Receipts ON;

-- Insert Sample Receipts (for finished rents)
-- Cost = Car.Price * (EndDate - StartDate in days)
INSERT INTO dbo.Receipts (Id, RentId, Cost, IssueDate) VALUES
(1, 1, (120.00 * 3), DATEADD(day, -12, GETDATE())),  -- Rent ID 1 (Car 2)
(2, 2, (250.00 * 7), DATEADD(day, -3, GETDATE())),   -- Rent ID 2 (Car 4)
(3, 7, (170.00 * 5), DATEADD(day, -15, GETDATE())),  -- Rent ID 7 (Car 10)
(4, 8, (50.00 * 2), DATEADD(day, -5, GETDATE())),    -- Rent ID 8 (Car 9)
(5, 9, (160.00 * 3), DATEADD(day, -22, GETDATE())),  -- Rent ID 9 (Car 11)
(6, 10, (90.00 * 2), DATEADD(day, -28, GETDATE())), -- Rent ID 10 (Car 12)
(7, 13, (80.00 * 5), DATEADD(day, -35, GETDATE())), -- Rent ID 13 (Car 3)
(8, 14, (100.00 * 5), DATEADD(day, -45, GETDATE()));-- Rent ID 14 (Car 7)

-- Disable explicit ID insertion for Receipts
SET IDENTITY_INSERT dbo.Receipts OFF;


PRINT 'Sample data inserted successfully (using single PhoneNumber column in Users) with expanded records.';