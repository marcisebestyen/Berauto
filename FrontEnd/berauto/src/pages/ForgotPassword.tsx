import { useState, FormEvent } from "react";
import { useNavigate } from 'react-router-dom';
import AuthContainer from "../components/AuthContainer.tsx";
import { Stack, TextInput, PasswordInput, Button, Text, Alert } from "@mantine/core";
import axiosInstance from '../api/axios.config.ts';

type ViewMode = 'enterEmail' | 'enterToken' | 'enterNewPassword' | 'success';

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState<ViewMode>("enterEmail");

    const [email, setEmail] = useState<string>('');
    const [token, setToken] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // Step 1: Enter email and request token
    const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axiosInstance.post('/password_reset/initiate', {
                email: email
            });

            if (response.status === 200) {
                setMessage(response.data.message || 'Ha az e-mail cím regisztrálva van, egy tokent küldtünk rá.');
                setViewMode('enterToken');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Hiba történt a token generálása közben.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Validate token format and move to password reset
    const handleTokenSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (token.length !== 6) {
            setError('A tokennek 6 számjegyből kell állnia.');
            return;
        }

        setMessage('Token elfogadva. Add meg az új jelszavadat.');
        setError('');
        setViewMode('enterNewPassword');
    };

    // Step 3: Reset password with token
    const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (newPassword !== confirmNewPassword) {
            setError('A két jelszó nem egyezik.');
            return;
        }

        if (newPassword.length < 6) {
            setError('A jelszónak legalább 6 karakter hosszúnak kell lennie.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axiosInstance.post('/password_reset/reset', {
                token: token,
                newPassword: newPassword
            });

            if (response.status === 200) {
                setMessage(response.data.message || 'A jelszó sikeresen módosítva!');
                setViewMode('success');
                // Clear sensitive data
                setEmail('');
                setToken('');
                setNewPassword('');
                setConfirmNewPassword('');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Hiba a jelszó módosításakor.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLogin = () => {
        navigate('/login');
    };

    const handleBackToEmail = () => {
        setViewMode('enterEmail');
        setError('');
        setMessage('');
    };

    return (
        <AuthContainer title="Elfelejtett jelszó">
            <>
                {viewMode === 'enterEmail' && (
                    <form onSubmit={handleEmailSubmit}>
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Add meg az e-mail címedet. Ha regisztrálva van, küldünk egy 6 számjegyű tokent,
                                amely 10 percig érvényes.
                            </Text>

                            <TextInput
                                label="E-mail cím"
                                placeholder="pelda@email.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                size="md"
                            />

                            <Button
                                type="submit"
                                loading={loading}
                                fullWidth
                                size="md"
                            >
                                {loading ? 'Küldés...' : 'Token kérése'}
                            </Button>

                            <Button
                                variant="subtle"
                                onClick={handleGoToLogin}
                                fullWidth
                                size="sm"
                            >
                                Vissza a bejelentkezéshez
                            </Button>
                        </Stack>
                    </form>
                )}

                {viewMode === 'enterToken' && (
                    <form onSubmit={handleTokenSubmit}>
                        <Stack gap="md">
                            {message && (
                                <Alert color="green" title="Token elküldve">
                                    {message}
                                </Alert>
                            )}

                            <Text size="sm" c="dimmed">
                                Ellenőrizd az email fiókod (<strong>{email}</strong>) és add meg
                                a 6 számjegyű tokent.
                            </Text>

                            <TextInput
                                label="Token"
                                placeholder="123456"
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                required
                                maxLength={6}
                                disabled={loading}
                                size="md"
                            />

                            <Button
                                type="submit"
                                loading={loading}
                                fullWidth
                                size="md"
                            >
                                Tovább
                            </Button>

                            <Button
                                variant="subtle"
                                onClick={handleBackToEmail}
                                fullWidth
                                size="sm"
                            >
                                Vissza
                            </Button>
                        </Stack>
                    </form>
                )}

                {viewMode === 'enterNewPassword' && (
                    <form onSubmit={handlePasswordReset}>
                        <Stack gap="md">
                            {message && (
                                <Alert color="blue" title="Token érvényes">
                                    {message}
                                </Alert>
                            )}

                            <PasswordInput
                                label="Új jelszó"
                                placeholder="Legalább 6 karakter"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={loading}
                                size="md"
                            />

                            <PasswordInput
                                label="Új jelszó megerősítése"
                                placeholder="Legalább 6 karakter"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                disabled={loading}
                                size="md"
                            />

                            <Button
                                type="submit"
                                loading={loading}
                                fullWidth
                                size="md"
                            >
                                {loading ? 'Mentés...' : 'Jelszó megváltoztatása'}
                            </Button>
                        </Stack>
                    </form>
                )}

                {viewMode === 'success' && (
                    <Stack gap="md" align="center">
                        <Alert color="green" title="Sikeres jelszó módosítás!" w="100%">
                            {message || 'A jelszó sikeresen módosítva!'}
                        </Alert>

                        <Text size="sm" c="dimmed" ta="center">
                            Most már bejelentkezhetsz az új jelszavaddal.
                        </Text>

                        <Button
                            onClick={handleGoToLogin}
                            size="md"
                            fullWidth
                        >
                            Bejelentkezés
                        </Button>
                    </Stack>
                )}

                {error && (
                    <Alert color="red" title="Hiba" mt="md">
                        {error}
                    </Alert>
                )}
            </>
        </AuthContainer>
    );
};

export default ForgotPassword;