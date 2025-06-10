import { useState, FormEvent } from "react";
import { useNavigate } from 'react-router-dom';
import AuthContainer from "../components/AuthContainer.tsx";

type ViewMode = 'enterEmail' | 'enterNewPassword' | 'success';

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState<ViewMode>("enterEmail");
    const [email, setEmail] = useState<string>('');
    const [verifiedEmail, setVerifiedEmail] = useState<string>('');

    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleEmailCheck = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const apiUrl = 'https://localhost:7205/api/users/check-email-for-direct-reset';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email}),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Hiba az e-mail ellenőrzésekor.');
            } else {
                if (data.emailExists) {
                    setVerifiedEmail(email);
                    setViewMode('enterNewPassword');
                } else {
                    setError('Ez az e-mail cím nem található a regisztrált felhasználók között, vagy nem aktív.');
                }
            }
        } catch (err) {
            setError('Ismeretlen hiba történt.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setError('A két jelszó nem egyezik.');
            return;
        }
        if (newPassword.length < 8) {
            setError('A jelszónak legalább 8 karakter hosszúnak kell lennie.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const apiUrl = 'https://localhost:7205/api/users/direct-reset-password';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email: verifiedEmail, newPassword: newPassword}),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || data.Errors?.join(', ') || 'Hiba a jelszó módosításakor.');
            } else {
                setMessage(data.message || 'A jelszó sikeresen módosítva!');
                setViewMode('success');
                setEmail('');
                setNewPassword('');
                setConfirmNewPassword('');
            }
        } catch (err) {
            setError('Ismeretlen hiba történt.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLogin = () => {
      navigate('/login');
    };

    return (
        <AuthContainer title="Elfelejtett jelszó">
            <>
                {viewMode === 'enterEmail' && (
                    <form onSubmit={handleEmailCheck}>
                        <p>Add meg az e-mail címedet a jelszó módosításához.</p>
                        <div style={{marginBottom: '15px'}}>
                            <label htmlFor="email">E-mail cím:</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                   required disabled={loading} style={{width: '100%', padding: '8px'}}/>
                        </div>
                        <button type="submit" disabled={loading} style={{width: '100%', padding: '10px'}}>
                            {loading ? 'Ellenőrzés...' : 'E-mail ellenőrzése'}
                        </button>
                    </form>
                )}

                {viewMode === 'enterNewPassword' && (
                    <form onSubmit={handlePasswordReset}>
                        <p>E-mail cím: <strong>{verifiedEmail}</strong></p>
                        <p>Add meg az új jelszavadat.</p>
                        <div style={{marginBottom: '15px'}}>
                            <label htmlFor="newPassword">Új jelszó:</label>
                            <input type="password" id="newPassword" value={newPassword}
                                   onChange={(e) => setNewPassword(e.target.value)} required disabled={loading}
                                   style={{width: '100%', padding: '8px'}}/>
                        </div>
                        <div style={{marginBottom: '15px'}}>
                            <label htmlFor="confirmNewPassword">Új jelszó megerősítése:</label>
                            <input type="password" id="confirmNewPassword" value={confirmNewPassword}
                                   onChange={(e) => setConfirmNewPassword(e.target.value)} required disabled={loading}
                                   style={{width: '100%', padding: '8px'}}/>
                        </div>
                        <button type="submit" disabled={loading} style={{width: '100%', padding: '10px'}}>
                            {loading ? 'Mentés...' : 'Új jelszó mentése'}
                        </button>
                    </form>
                )}

                {viewMode === 'success' && (
                    <div style={{color: 'green', textAlign: 'center'}}>
                        <p>{message || 'A jelszó sikeresen módosítva!'}</p>
                        <button
                            onClick={handleGoToLogin}
                            style={{
                                marginTop: '20px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px'
                            }}
                        >
                             Vissza a bejelentkezéshez
                        </button>
                    </div>
                )}

                {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
            </>
        </AuthContainer>
    );
};

export default ForgotPassword;