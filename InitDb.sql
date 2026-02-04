-- Adatbázis kiválasztása
USE BerautoDb;
GO

-- Tranzakció indítása az adatmanipulációkhoz
BEGIN TRANSACTION;

-- Meglévő adatok törlése a helyes sorrendben (gyermek táblák először)
DELETE FROM [dbo].[Receipts];
DELETE FROM [dbo].[Rents];
DELETE FROM [dbo].[WaitingList];
DELETE FROM [dbo].[Cars];
DELETE FROM [dbo].[Users];

PRINT 'Meglévő adatok törölve (ha voltak).';

-- Identity magok (seed) visszaállítása, hogy az ID-k 1-től kezdődjenek
DBCC CHECKIDENT ('[dbo].[Users]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Cars]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Rents]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Receipts]', RESEED, 0);

PRINT 'Identity magok visszaállítva.';

-- Users tábla feltöltése
INSERT INTO [dbo].[Users] ([FirstName], [LastName], [UserName], [PhoneNumber], [RegisteredUser], [LicenceId], [Role], [Email], [Password], [Address])
VALUES
('Nagy', 'Eleonóra', 'nagy.eleonora', '06301234567', 1, 'AB12345', 0, 'nagy.eleonora@example.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2','Budapest, Rákóczi út 76., 1070'),
('Kis', 'Miklós', 'kis.miklos', '06707654321', 1, 'CD67890', 0, 'kis.miklos@example.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2','Debrecen, Fő utca 2., 4029'),
('Kovács', 'Béla', 'kovacs.bela', '06201112233', 0, 'EF54321', 0, 'kovacs.bela@example.com', NULL,'Szeged, Kárász utca 9., 6720'),
('Szabó', 'Éva', 'szabo.eva', '06309876543', 1, 'GH09876', 0, 'szabo.eva@example.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2','Pécs, Király utca 45., 7621'),
('Horváth', 'János', 'horvath.janos', '06701231231', 0, 'IJ21098', 0, 'horvath.janos@example.com', NULL,'Győr, Baross Gábor út 21., 9021'),
('Admin', 'Felhasználó', 'admin', '06000000000', 1, NULL, 2, 'admin@berauto.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2','Miskolc, Széchenyi utca 54., 3530'),
('Staff', 'Egy', 'staff1', '06000000001', 1, NULL, 1, 'staff1@berauto.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2','Székesfehérvár, Ady Endre utca 12., 8000'),
('Staff', 'Kettő', 'staff2', '06000000002', 1, NULL, 1, 'staff2@berauto.com', '$2b$10$C.QahImGvzeKclWeDZYxF.bbbrB1hyiq9X6.JdRA/.jYxPGxjLn.2','Eger, Széchenyi István utca 1., 3300');

PRINT 'Users tábla feltöltve.';

-- Cars tábla feltöltése az aktualizált dátumokkal
INSERT INTO [dbo].[Cars] ([FuelType], [RequiredLicence], [LicencePlate], [HasValidVignette], [PricePerDay], [IsAutomatic], [ActualKilometers], [InProperCondition], [Brand], [Model], [IsDeleted], [IsRented], [KilometersAtLastInspection], [LastTechnicalInspection])
VALUES
(1, 4, 'ABC-123', 1, 12000.00, 0, 55000.50, 1, 'Toyota', 'Corolla', 0, 0, 54500, '2024-10-20 10:00:00'),
(0, 4, 'DEF-456', 1, 15000.00, 1, 75000.00, 1, 'Volkswagen', 'Passat', 0, 0, 74000, '2024-11-15 12:00:00'),
(3, 4, 'GHI-789', 1, 18000.00, 1, 22000.75, 1, 'Tesla', 'Model 3', 0, 0, 21500, '2024-12-05 14:00:00'),
(1, 4, 'JKL-012', 0, 10000.00, 0, 105000.20, 1, 'Ford', 'Focus', 0, 0, 104000, '2025-01-20 09:00:00'),
(2, 4, 'MNO-345', 1, 20000.00, 1, 15000.00, 0, 'BMW', 'X5', 0, 0, 14500, '2025-02-15 11:00:00');

PRINT 'Cars tábla feltöltve.';

-- Rents tábla feltöltése
INSERT INTO [dbo].[Rents]
([RenterId], [PlannedStart], [PlannedEnd], [ActualStart], [ActualEnd], [ApprovedBy], [IssuedBy], [TakenBackBy], [CarId], [StartingKilometer], [EndingKilometer], [InvoiceRequest], [IssuedAt], [ReceiptId], [TotalCost])
VALUES
(1, '2025-06-01 10:00:00', '2025-06-03 10:00:00', '2025-06-01 09:55:00', '2025-06-03 09:50:00', 7, 7, 7, 1, 55000.50, 55250.50, 1, '2025-06-03 09:52:00', 1, 24000.00),
(2, '2025-06-05 14:00:00', '2025-06-07 18:00:00', '2025-06-05 14:05:00', '2025-06-07 17:50:00', 8, 8, 6, 2, 75000.00, 75450.00, 0, '2025-06-07 17:55:00', 2, 45000.00),
(4, '2025-06-10 08:00:00', '2025-06-12 08:00:00', '2025-06-10 07:50:00', '2025-06-12 08:10:00', 6, 7, 8, 3, 22000.75, 22300.75, 1, '2025-06-12 08:12:00', 3, 36000.00);

PRINT 'Rents tábla feltöltve.';

-- Receipts tábla feltöltése
INSERT INTO [dbo].[Receipts] ([RentId], [TotalCost], [IssueDate], [IssuedBy], [InvoiceNumber], [SellerInfoJson], [BuyerInfoJson], [LineItemsJson])
VALUES
(1, 24000.00, '2025-06-03 09:52:00', 7, 'INV-2025-0001',
    N'{"Name":"Bérautó Kft.","Address":"Kossuth u. 1. 1000 Budapest","TaxId":"12345678-2-42","BankAccount":"11111111-22222222-33333333","Email":"info@berauto.hu"}',
    N'{"Name":"Nagy Eleonóra","Address":"Budapest, Rákóczi út 76., 1070","TaxId":null,"BankAccount":null,"Email":"nagy.eleonora@example.com"}',
    N'[{"Description":"Toyota Corolla bérlés (2 nap)","Quantity":2,"UnitPrice":12000.00,"LineTotal":24000.00}]'
),
(2, 45000.00, '2025-06-07 17:55:00', 6, 'INV-2025-0002',
    N'{"Name":"Bérautó Kft.","Address":"Kossuth u. 1. 1000 Budapest","TaxId":"12345678-2-42","BankAccount":"11111111-22222222-33333333","Email":"info@berauto.hu"}',
    N'{"Name":"Kis Miklós","Address":"Debrecen, Fő utca 2., 4029","TaxId":null,"BankAccount":null,"Email":"kis.miklos@example.com"}',
    N'[{"Description":"Volkswagen Passat bérlés (3 nap)","Quantity":3,"UnitPrice":15000.00,"LineTotal":45000.00}]'
),
(3, 36000.00, '2025-06-12 08:12:00', 8, 'INV-2025-0003',
    N'{"Name":"Bérautó Kft.","Address":"Kossuth u. 1. 1000 Budapest","TaxId":"12345678-2-42","BankAccount":"11111111-22222222-33333333","Email":"info@berauto.hu"}',
    N'{"Name":"Szabó Éva","Address":"Pécs, Király utca 45., 7621","TaxId":null,"BankAccount":null,"Email":"szabo.eva@example.com"}',
    N'[{"Description":"Tesla Model 3 bérlés (2 nap)","Quantity":2,"UnitPrice":18000.00,"LineTotal":36000.00}]'
);

PRINT 'Receipts tábla feltöltve.';

-- Tranzakció jóváhagyása, ha minden sikeres volt
COMMIT TRANSACTION;
PRINT 'Minden adat sikeresen feltöltve, tranzakció jóváhagyva.';

GO

PRINT 'Az adatbázis inicializálása befejeződött.';
GO

-- Ellenőrző SELECT utasítások (opcionális)
-- SELECT * FROM [dbo].[Users];
-- SELECT * FROM [dbo].[Cars];
-- SELECT * FROM [dbo].[Rents];
-- SELECT * FROM [dbo].[Receipts];
-- SELECT * FROM [dbo].[WaitingLists]; -- Hozzáadva, ha van ilyen tábla
GO