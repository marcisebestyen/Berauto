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
    Grid,
    Group,
} from "@mantine/core";
import {useForm} from '@mantine/form';
import {
    IconUser,
    IconAt,
    IconLock,
    IconPhone,
    IconLicense,
    IconHome,
    IconAlertCircle,
    IconCheck,
} from '@tabler/icons-react';
import {IUserProfile} from "../interfaces/IUser.ts";

const Register = () => {
    const navigate = useNavigate();
    const [apiError, setApiError] = useState<string | string[]>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const form = useForm<IUserProfile & { confirmPassword: string }>({
        initialValues: {
            firstName: '', lastName: '', userName: '', email: '',
            phoneNumber: '', licenceId: '', password: '', address: '', confirmPassword: '',
        },
        validate: {
            firstName: (val) => (val.trim().length < 2 ? 'A keresztnév legalább 2 karakter legyen' : null),
            lastName: (val) => (val.trim().length < 2 ? 'A vezetéknév legalább 2 karakter legyen' : null),
            userName: (val) => (val.trim().length < 3 ? 'A felhasználónév legalább 3 karakter legyen' : null),
            email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Érvénytelen e-mail cím'),
            address: (val) => (val.trim().length < 5 ? 'Kérjük, adjon meg egy érvényes lakcímet' : null),
            password: (val) => (val.length < 6 ? 'A jelszónak legalább 6 karakternek kell lennie' : null),
            confirmPassword: (val, values) => (val !== values.password ? 'A két jelszó nem egyezik' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        setApiError('');
        setSuccessMessage('');

        const {confirmPassword, ...profileData} = values;

        try {
            const response = await fetch('https://localhost:7205/api/users/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(profileData),
            });

            const data = await response.json();

            if (!response.ok) {
                const modelErrors = data.errors ? Object.values(data.errors).flat() as string[] : [];
                if (modelErrors.length > 0) {
                    setApiError(modelErrors);
                } else {
                    setApiError(data.message || data.title || `Hiba: ${response.statusText}`);
                }
            } else {
                setSuccessMessage('Sikeres regisztráció! Átirányítunk a bejelentkezési oldalra...');
                form.reset();
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (error) {
            setApiError('Ismeretlen hiba történt a kapcsolat során. Próbálja újra később.');
        } finally {
            setLoading(false);
        }
    };

    const renderApiErrors = () => {
        if (!apiError) return null;
        const messages = Array.isArray(apiError) ? apiError : [apiError];
        return (
            <Alert icon={<IconAlertCircle size="1rem"/>} title="Regisztrációs Hiba" color="red" withCloseButton
                   onClose={() => setApiError('')} mb="md">
                <Stack gap="xs">
                    {messages.map((msg, i) => <Text key={i} size="sm">{msg}</Text>)}
                </Stack>
            </Alert>
        );
    };

    return (
        <Container size={560} my={40}>
            <Title ta="center">Fiók Létrehozása</Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Már van fiókod?{' '}
                <Anchor size="sm" component="button" onClick={() => navigate('/login')}>
                    Jelentkezz be itt
                </Anchor>
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        {renderApiErrors()}
                        {successMessage && (
                            <Alert icon={<IconCheck size="1rem"/>} title="Siker!" color="green" mb="md">
                                {successMessage}
                            </Alert>
                        )}

                        <Grid>
                            <Grid.Col span={{base: 12, sm: 6}}>
                                <TextInput withAsterisk label="Vezetéknév" placeholder="Minta"
                                           leftSection={<IconUser size={16}/>} {...form.getInputProps('lastName')} />
                            </Grid.Col>
                            <Grid.Col span={{base: 12, sm: 6}}>
                                <TextInput withAsterisk label="Keresztnév" placeholder="János"
                                           leftSection={<IconUser size={16}/>} {...form.getInputProps('firstName')} />
                            </Grid.Col>
                        </Grid>

                        <TextInput withAsterisk label="Felhasználónév" placeholder="minta.janos"
                                   leftSection={<IconUser size={16}/>} {...form.getInputProps('userName')} />
                        <TextInput withAsterisk label="E-mail cím" placeholder="pelda@email.com"
                                   leftSection={<IconAt size={16}/>} {...form.getInputProps('email')} />
                        <TextInput withAsterisk label="Lakcím" placeholder="1234 Város, Minta utca 1."
                                   leftSection={<IconHome size={16}/>} {...form.getInputProps('address')} />

                        <Group grow>
                            <TextInput label="Telefonszám" placeholder="+36 30 123 4567"
                                       leftSection={<IconPhone size={16}/>} {...form.getInputProps('phoneNumber')} />
                            <TextInput label="Jogosítvány azonosító" placeholder="AB123456"
                                       leftSection={<IconLicense size={16}/>} {...form.getInputProps('licenceId')} />
                        </Group>

                        <PasswordInput withAsterisk label="Jelszó" placeholder="Legalább 6 karakter"
                                       leftSection={<IconLock size={16}/>} {...form.getInputProps('password')} />
                        <PasswordInput withAsterisk label="Jelszó megerősítése" placeholder="Jelszó újra"
                                       leftSection={<IconLock size={16}/>} {...form.getInputProps('confirmPassword')} />

                        <Button type="submit" fullWidth mt="xl" loading={loading} disabled={!!successMessage}>
                            Regisztráció
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
};

export default Register;