import React, {useState, FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import AuthContainer from "../components/AuthContainer.tsx";

interface RegistrationFormData {
    FirstName: string;
    LastName: string;
    PhoneNumber: string;
    LicenceId: string;
    Email: string;
    Password: string;
}

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<RegistrationFormData>({
        FirstName: '',
        LastName: '',
        PhoneNumber: '',
        LicenceId: '',
        Email: '',
        Password: '',
    });
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string | string[]>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (formData.Password !== confirmPassword) {
            setError('A megadott jelszavak nem egyeznek.');
            return;
        }

        if (formData.Password.length < 6) {
            setError('A jelszónak legalább 6 karakter hosszúnak kell lennie.');
            return;
        }
        if (!formData.FirstName || !formData.LastName || !formData.Email) {
            setError('A csillaggal jelölt mezők kitöltése kötelező.');
            return;
        }

        setLoading(true);

        try {
            const apiUrl = 'https://localhost:7205/api/users/register';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.Errors && Array.isArray(data.Errors)) {
                    setError(data.Errors);
                } else if (data.Message) {
                    setError(data.Message);
                } else if (data.Errors) {
                    const modelErrors = Object.values(data.Errors).flat() as string[];
                    setError(modelErrors.length > 0 ? modelErrors : 'Érvénytelen bemeneti adatok.');
                } else {
                    setError(`Hiba történt: ${response.statusText} (Státusz: ${response.status})`);
                }
            } else {
                setSuccessMessage('Sikeres regisztráció! Hamarosan átirányítunk a bejelentkezési oldalra.');
                setFormData({FirstName: '', LastName: '', PhoneNumber: '', LicenceId: '', Email: '', Password: ''});
                setConfirmPassword('');

                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error) {
            console.log("Regisztrációs API hiba: ", error);
            setError('Ismeretlen hiba történt a kapcsolat során. Kérjük, próbáld újra később.');
        } finally {
            setLoading(false);
        }
    };

    const renderErrorMessages = () => {
        if (!error) return null;
        if (Array.isArray(error)) {
            return (
                <ul>
                    {error.map((err, index) => (
                        <li key={index} style={{color: 'red'}}>{err}</li>
                    ))}
                </ul>
            );
        }
        return <p style={{color: 'red'}}>{error}</p>;
    };

    return (
        <AuthContainer title="Regisztráció">
            <form onSubmit={handleSubmit}>
                {/* Keresztnév */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="FirstName">Keresztnév <span style={{color: "red"}}>*</span>:</label>
                    <input type="text" id="FirstName" name="FirstName" value={formData.FirstName}
                           onChange={handleChange} required disabled={loading}
                           style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Vezetéknév */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="LastName">Vezetéknév <span style={{color: "red"}}>*</span>:</label>
                    <input type="text" id="LastName" name="LastName" value={formData.LastName} onChange={handleChange}
                           required disabled={loading} style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Telefonszám (opcionális) */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="PhoneNumber">Telefonszám:</label>
                    <input type="tel" id="PhoneNumber" name="PhoneNumber" value={formData.PhoneNumber}
                           onChange={handleChange} disabled={loading} style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Jogosítvány száma (opcionális) */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="LicenceId">Jogosítvány azonosító:</label>
                    <input type="text" id="LicenceId" name="LicenceId" value={formData.LicenceId}
                           onChange={handleChange} disabled={loading} style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* E-mail cím */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="Email">E-mail cím <span style={{color: "red"}}>*</span>:</label>
                    <input type="email" id="Email" name="Email" value={formData.Email} onChange={handleChange} required
                           disabled={loading} style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Jelszó */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="Password">Jelszó <span style={{color: "red"}}>*</span> (min. 6 karakter):</label>
                    <input type="password" id="Password" name="Password" value={formData.Password}
                           onChange={handleChange} required disabled={loading}
                           style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Jelszó megerősítése */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="confirmPassword">Jelszó megerősítése <span style={{color: "red"}}>*</span>:</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading}
                           style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Hiba és sikerüzenetek */}
                {renderErrorMessages()}
                {successMessage && <p style={{color: 'green'}}>{successMessage}</p>}

                <button type="submit" disabled={loading} style={{width: '100%', padding: '10px', marginTop: '10px'}}>
                    {loading ? 'Regisztráció folyamatban...' : 'Regisztráció'}
                </button>
            </form>
        </AuthContainer>
    );
};

export default Register;