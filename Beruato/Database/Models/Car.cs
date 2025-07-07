namespace Database.Models
{
    public enum RequiredLicence
    {
        AM,
        A1,
        A2,
        A,
        B
    }

    public enum FuelType
    {
        Diesel,
        Petrol,
        Hybrid,
        Electric
    }

    public class Car
    {
        public int Id { get; set; }
        public string Brand { get; set; }
        public string Model { get; set; }
        public FuelType FuelType { get; set; }
        public required RequiredLicence RequiredLicence { get; set; }
        public string LicencePlate { get; set; }
        public bool HasValidVignette { get; set; }
        public decimal PricePerDay { get; set; }
        public bool IsAutomatic { get; set; }
        public decimal ActualKilometers { get; set; }
        public bool InProperCondition { get; set; } // műszaki állapota megfelelő 
        public bool IsDeleted { get; set; } = false;
    }
}
/*
 * az igény táblából kell lekérdezni, hogy az igényelni kívánt
 * intervallumban van-e igény az adott autóra,
 * amennyiben igen => nem elérhető, egyébként => elérhető
 */

/*
 * InProperCondition állapot nem összekeverendő azzal, hogy elérhető
 * (igényelhető dátum szerint), arra vonatkozik, hogy műszakilag
 * renben van, ezt az admin tudja állítani
 */
