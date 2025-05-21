import React, {useState, FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import AuthContainer from "../components/AuthContainer.tsx";
import {IUserProfile} from "../interfaces/IUser.ts";

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<IUserProfile>({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        phoneNumber: '',
        licenceId: '',
        password: '',
        address: '',
    });
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string | string[]>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = event.target;
        console.log(`Mező neve: ${name}, Értéke: ${value}`);
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (formData.password !== confirmPassword) {
            setError('A megadott jelszavak nem egyeznek.');
            return;
        }

        if (formData.password.length < 6) {
            setError('A jelszónak legalább 6 karakter hosszúnak kell lennie.');
            return;
        }

        if (!formData.firstName || !formData.lastName || !formData.userName || !formData.email || !formData.address) {
            setError('A csillaggal jelölt mezők kitöltése kötelező.');
            return;
        }

        setLoading(true);

        console.log("Küldendő formData:", formData);
        const bodyToSend = JSON.stringify(formData);
        console.log("JSON payload:", bodyToSend);

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
                setFormData({
                    firstName: '',
                    lastName: '',
                    userName: '',
                    phoneNumber: '',
                    licenceId: '',
                    email: '',
                    password: '',
                    address: ''
                });
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
                    <label htmlFor="firstName">Keresztnév <span style={{color: "red"}}>*</span>:</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName}
                           onChange={handleChange} required disabled={loading}
                           style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Vezetéknév */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="lastName">Vezetéknév <span style={{color: "red"}}>*</span>:</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange}
                           required disabled={loading} style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Felhasználónév */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="userName">Felhasználónév <span style={{color: "red"}}>*</span>:</label>
                    <input type="text" id="userName" name="userName" value={formData.userName}
                           onChange={handleChange} required disabled={loading}
                           style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Telefonszám (opcionális) */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="phoneNumber">Telefonszám:</label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber}
                           onChange={handleChange} disabled={loading} style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Jogosítvány száma (opcionális) */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="licenceId">Jogosítvány azonosító:</label>
                    <input type="text" id="licenceId" name="licenceId" value={formData.licenceId}
                           onChange={handleChange} disabled={loading} style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* E-mail cím */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="email">E-mail cím <span style={{color: "red"}}>*</span>:</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required
                           disabled={loading} style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Lakcím */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="address">Lakcím <span style={{color: "red"}}>*</span>:</label>
                    <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required
                           disabled={loading} style={{width: '100%', padding: '8px'}}/>
                </div>

                {/* Jelszó */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="password">Jelszó <span style={{color: "red"}}>*</span> (min. 6 karakter):</label>
                    <input type="password" id="password" name="password" value={formData.password}
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