import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Stack,
    TextInput,
    PasswordInput,
    Button,
    Text,
    Alert,
    Container,
    Title,
    Paper,
    Anchor,
} from "@mantine/core";
import {useForm} from '@mantine/form';
import {IconAt, IconHash, IconLock, IconAlertCircle, IconCheck} from '@tabler/icons-react';
import axiosInstance from '../api/axios.config.ts';

type ViewMode = 'enterEmail' | 'enterToken' | 'enterNewPassword' | 'success';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>("enterEmail");

    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [userEmail, setUserEmail] = useState<string>('');

    const form = useForm({
        initialValues: {
            email: '',
            token: '',
            newPassword: '',
            confirmNewPassword: '',
        },
        validate: {
            email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Érvénytelen e-mail cím'),
            token: (val) => (val.length !== 6 ? 'A tokennek 6 számjegyből kell állnia' : null),
            newPassword: (val) => (val.length < 6 ? 'A jelszónak legalább 6 karakteresnek kell lennie' : null),
            confirmNewPassword: (val, values) => (val !== values.newPassword ? 'A két jelszó nem egyezik' : null),
        },
    });

    const handleEmailSubmit = async ({email}: { email: string }) => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await axiosInstance.post('/password_reset/initiate', {email});
            setSuccessMessage('Ha az e-mail cím regisztrálva van, egy tokent küldtünk rá.');
            setUserEmail(email); // Store the email for display
            setViewMode('enterToken');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Hiba történt a token kérése közben.');
        } finally {
            setLoading(false);
        }
    };

    const handleTokenSubmit = () => {
        if (form.validateField('token').hasError) return;
        setSuccessMessage('Token elfogadva. Add meg az új jelszavadat.');
        setError('');
        setViewMode('enterNewPassword');
    };

    const handlePasswordReset = async ({token, newPassword}: { token: string, newPassword: string }) => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await axiosInstance.post('/password_reset/reset', {token, newPassword});
            setSuccessMessage('A jelszó sikeresen módosítva!');
            setViewMode('success');
            form.reset();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Hiba a jelszó módosításakor. A token lejárt vagy érvénytelen.');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (viewMode) {
            case 'enterEmail':
                return (
                    <form onSubmit={form.onSubmit(handleEmailSubmit)}>
                        <Stack>
                            <Text size="sm" c="dimmed">
                                Add meg a fiókodhoz tartozó e-mail címet, és küldünk egy 6 számjegyű kódot a jelszavad
                                visszaállításához.
                            </Text>
                            <TextInput required label="E-mail cím" placeholder="pelda@email.com"
                                       leftSection={<IconAt size={16}/>} {...form.getInputProps('email')} />
                            <Button type="submit" loading={loading} fullWidth mt="md">Token kérése</Button>
                        </Stack>
                    </form>
                );
            case 'enterToken':
                return (
                    <form onSubmit={form.onSubmit(handleTokenSubmit)}>
                        <Stack>
                            <Text size="sm" c="dimmed">
                                Elküldtük a kódot a következő címre: <strong>{userEmail}</strong>. Kérjük, add meg
                                alább.
                            </Text>
                            <TextInput required label="Visszaigazoló kód" placeholder="123456"
                                       leftSection={<IconHash size={16}/>} {...form.getInputProps('token')}
                                       maxLength={6}/>
                            <Button type="submit" loading={loading} fullWidth mt="md">Tovább</Button>
                        </Stack>
                    </form>
                );
            case 'enterNewPassword':
                return (
                    <form onSubmit={form.onSubmit(handlePasswordReset)}>
                        <Stack>
                            <Text size="sm" c="dimmed">Válassz egy új, erős jelszót.</Text>
                            <PasswordInput required label="Új jelszó" placeholder="Új jelszó"
                                           leftSection={<IconLock size={16}/>} {...form.getInputProps('newPassword')} />
                            <PasswordInput required label="Új jelszó megerősítése" placeholder="Új jelszó újra"
                                           leftSection={<IconLock
                                               size={16}/>} {...form.getInputProps('confirmNewPassword')} />
                            <Button type="submit" loading={loading} fullWidth mt="md">Jelszó megváltoztatása</Button>
                        </Stack>
                    </form>
                );
            case 'success':
                return (
                    <Stack align="center">
                        <Alert icon={<IconCheck size="1rem"/>} title="Siker!" color="green" w="100%" ta="left">
                            {successMessage}
                        </Alert>
                        <Button onClick={() => navigate('/login')} fullWidth mt="md">Vissza a bejelentkezéshez</Button>
                    </Stack>
                );
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">Elfelejtett jelszó</Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Vagy{' '}
                <Anchor size="sm" component="button" onClick={() => navigate('/login')}>
                    térj vissza a bejelentkezéshez
                </Anchor>
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                {successMessage && viewMode !== 'success' && (
                    <Alert color="teal" title="Információ" withCloseButton onClose={() => setSuccessMessage('')}
                           mb="md">
                        {successMessage}
                    </Alert>
                )}
                {error && (
                    <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba" color="red" withCloseButton
                           onClose={() => setError('')} mb="md">
                        {error}
                    </Alert>
                )}
                {renderContent()}
            </Paper>
        </Container>
    );
};

export default ForgotPassword;