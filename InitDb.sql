-- Adatbázis kiválasztása (opcionális, ha már a megfelelő kontextusban vagy)
USE BerautoDb
GO

-- Tranzakció indítása az adatmanipulációkhoz
BEGIN TRANSACTION;

-- Meglévő adatok törlése a helyes sorrendben (gyermek táblák először)
-- Hiba esetén a tranzakció visszagördül.
DELETE FROM [dbo].[Receipts];
DELETE FROM [dbo].[Rents];
DELETE FROM [dbo].[Cars];
DELETE FROM [dbo].[Users];

PRINT 'Meglévő adatok törölve (ha voltak).';

-- Identity magok (seed) visszaállítása, hogy az ID-k 1-től kezdődjenek
DBCC CHECKIDENT ('Users', RESEED, 0);
DBCC CHECKIDENT ('Cars', RESEED, 0);
DBCC CHECKIDENT ('Rents', RESEED, 0);
DBCC CHECKIDENT ('Receipts', RESEED, 0);

PRINT 'Identity magok visszaállítva.';

-- Users tábla feltöltése (Id-t nem adunk meg)
-- Role: Renter = 0, Staff = 1, Admin = 2
-- UserName kötelező és egyedi. Email nullázható, de ha meg van adva, akkor egyedi.
INSERT INTO [dbo].[Users] ([FirstName], [LastName], [UserName], [PhoneNumber], [RegisteredUser], [LicenceId], [Role], [Email], [Password])
VALUES
('Nagy', 'Eleonóra', 'nagy.eleonora', '06301234567', 1, 'AB12345', 0, 'nagy.eleonora@example.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2'), -- Várható ID: 1
('Kis', 'Miklós', 'kis.miklos', '06707654321', 1, 'CD67890', 0, 'kis.miklos@example.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2'),    -- Várható ID: 2
('Kovács', 'Béla', 'kovacs.bela', '06201112233', 0, 'EF54321', 0, 'kovacs.bela@example.com', NULL),                                                        -- Várható ID: 3
('Szabó', 'Éva', 'szabo.eva', '06309876543', 1, 'GH09876', 0, 'szabo.eva@example.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2'),    -- Várható ID: 4
('Horváth', 'János', 'horvath.janos', '06701231231', 0, 'IJ21098', 0, 'horvath.janos@example.com', NULL),                                                      -- Várható ID: 5
-- Staff/Admin felhasználók
('Admin', 'Felhasználó', 'admin', '06000000000', 1, NULL, 2, 'admin@berauto.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2'),          -- Várható ID: 6 (Admin)
('Staff', 'Egy', 'staff1', '06000000001', 1, NULL, 1, 'staff1@berauto.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2'),         -- Várható ID: 7 (Staff)
('Staff', 'Kettő', 'staff2', '06000000002', 1, NULL, 1, 'staff2@berauto.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2'); -- Várható ID: 8 (Staff)

PRINT 'Users tábla feltöltve.';

-- Cars tábla feltöltése (Id-t nem adunk meg)
-- FuelType: Diesel = 0, Petrol = 1, Hybrid = 2, Electric = 3
-- RequiredLicence: AM = 0, A1 = 1, A2 = 2, A = 3, B = 4
INSERT INTO [dbo].[Cars] ([FuelType], [RequiredLicence], [LicencePlate], [HasValidVignette], [PricePerKilometer], [IsAutomatic], [ActualKilometers], [InProperCondition], [Brand], [Model])
VALUES
(1, 4, 'ABC-123', 1, 150.00, 0, 55000.50, 1, 'Toyota', 'Corolla'), -- Petrol, B (Várható ID: 1)
(0, 4, 'DEF-456', 1, 160.00, 1, 75000.00, 1, 'Volkswagen', 'Passat'), -- Diesel, B (Várható ID: 2)
(3, 4, 'GHI-789', 1, 120.00, 1, 22000.75, 1, 'Tesla', 'Model 3'), -- Electric, B (Várható ID: 3)
(1, 4, 'JKL-012', 0, 140.00, 0, 105000.20, 1, 'Ford', 'Focus'), -- Petrol, B (Várható ID: 4)
(2, 4, 'MNO-345', 1, 170.00, 1, 15000.00, 0, 'BMW', 'X5'); -- Hybrid, B (Várható ID: 5)

PRINT 'Cars tábla feltöltve.';

-- Rents tábla feltöltése (Id-t nem adunk meg)
-- RenterId, ApprovedBy, IssuedBy, TakenBackBy, CarId értékek a fentebb beszúrt Users és Cars ID-kra hivatkoznak.
INSERT INTO [dbo].[Rents]
([RenterId], [PlannedStart], [PlannedEnd], [ActualStart], [ActualEnd], [ApprovedBy], [IssuedBy], [TakenBackBy], [CarId], [StartingKilometer], [EndingKilometer], [InvoiceRequest], [IssuedAt])
VALUES
-- Renter: User 1 (Nagy Eleonóra), Approver/Issuer/Recipient: User 7 (staff1), Car: Car 1
(1, '2025-06-01 10:00:00', '2025-06-03 10:00:00', '2025-06-01 09:55:00', '2025-06-03 09:50:00', 7, 7, 7, 1, 55000.50, 55250.50, 1, '2025-06-03 09:52:00'), -- Várható Rent ID: 1
-- Renter: User 2 (Kis Miklós), Approver/Issuer: User 8 (staff2), Recipient: User 6 (admin), Car: Car 2
(2, '2025-06-05 14:00:00', '2025-06-07 18:00:00', '2025-06-05 14:05:00', '2025-06-07 17:50:00', 8, 8, 6, 2, 75000.00, 75450.00, 0, '2025-06-07 17:55:00'), -- Várható Rent ID: 2
-- Renter: User 4 (Szabó Éva), Approver: User 6 (admin), Issuer: User 7 (staff1), Recipient: User 8 (staff2), Car: Car 3
(4, '2025-06-10 08:00:00', '2025-06-12 08:00:00', '2025-06-10 07:50:00', '2025-06-12 08:10:00', 6, 7, 8, 3, 22000.75, 22300.75, 1, '2025-06-12 08:12:00'); -- Várható Rent ID: 3

PRINT 'Rents tábla feltöltve.';

-- Receipts tábla feltöltése (Id-t nem adunk meg)
-- RentId a fentebb beszúrt Rents ID-kra hivatkozik. IssuedBy a Users tábla ID-jára.
INSERT INTO [dbo].[Receipts] ([RentId], [TotalCost], [IssueDate], [IssuedBy])
VALUES
-- Rent: Rent 1, Issuer: User 7 (staff1)
(1, 37500.00, '2025-06-03 09:52:00', 7),
-- Rent: Rent 2, Issuer: User 6 (admin)
(2, 72000.00, '2025-06-07 17:55:00', 6),
-- Rent: Rent 3, Issuer: User 8 (staff2)
(3, 36000.00, '2025-06-12 08:12:00', 8);

PRINT 'Receipts tábla feltöltve.';

-- Tranzakció jóváhagyása, ha minden sikeres volt
COMMIT TRANSACTION;
PRINT 'Minden adat sikeresen feltöltve, tranzakció jóváhagyva.';

GO

PRINT 'Az adatbázis inicializálása befejeződött.';

select * from Cars
select * from Users
select * from Receipts
select * from Rents
-- Adatbázis kiválasztása (opcionális, ha már a megfelelő kontextusban vagy)
