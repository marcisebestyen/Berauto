using System.Security.Cryptography;
using System.Text;

namespace Services.Services
{
    public class CustomHashService
    {
        public string HashPassword(string password)
        {
            byte[] salt = GenerateSalt();

            using (var sha256 = SHA256.Create())
            {
                byte[] saltedPassword = Combine(Encoding.UTF8.GetBytes(password), salt);

                byte[] hash = sha256.ComputeHash(saltedPassword);

                byte[] hashWithSalt = Combine(hash, salt);

                return Convert.ToBase64String(hashWithSalt);
            }
        }

        public bool VerifyPassword(string storedHash, string password)
        {
            byte[] hashWithSalt = Convert.FromBase64String(storedHash);

            byte[] salt = new byte[16];  
            Array.Copy(hashWithSalt, hashWithSalt.Length - salt.Length, salt, 0, salt.Length);
            byte[] storedHashBytes = new byte[hashWithSalt.Length - salt.Length];
            Array.Copy(hashWithSalt, storedHashBytes, storedHashBytes.Length);

            using (var sha256 = SHA256.Create())
            {
                byte[] saltedPassword = Combine(Encoding.UTF8.GetBytes(password), salt);
                byte[] hash = sha256.ComputeHash(saltedPassword);

                return AreEqual(hash, storedHashBytes);
            }
        }

        private byte[] Combine(byte[] first, byte[] second)
        {
            byte[] combined = new byte[first.Length + second.Length];
            Array.Copy(first, 0, combined, 0, first.Length);
            Array.Copy(second, 0, combined, first.Length, second.Length);
            return combined;
        }

        private bool AreEqual(byte[] first, byte[] second)
        {
            if (first.Length != second.Length)
                return false;

            for (int i = 0; i < first.Length; i++)
            {
                if (first[i] != second[i])
                    return false;
            }
            return true;
        }

        private byte[] GenerateSalt()
        {
            using (var rng = new RNGCryptoServiceProvider())
            {
                byte[] salt = new byte[16];
                rng.GetBytes(salt);
                return salt;
            }
        }
    }
}
