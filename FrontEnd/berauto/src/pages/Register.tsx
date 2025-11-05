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
    ThemeIcon,
    Box,
    Divider,
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
    IconUserPlus,
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
            firstName: (val) => (!val || val.trim().length < 2 ? 'A keresztnév legalább 2 karakter legyen' : null),
            lastName: (val) => (!val || val.trim().length < 2 ? 'A vezetéknév legalább 2 karakter legyen' : null),
            userName: (val) => (!val || val.trim().length < 3 ? 'A felhasználónév legalább 3 karakter legyen' : null),
            email: (val) => (!val || !/^\S+@\S+$/.test(val) ? 'Érvénytelen e-mail cím' : null),
            address: (val) => (!val || val.trim().length < 5 ? 'Kérjük, adjon meg egy érvényes lakcímet' : null),
            password: (val) => (!val || val.length < 6 ? 'A jelszónak legalább 6 karakternek kell lennie' : null),
            confirmPassword: (val, values) => (!val || val !== values.password ? 'A két jelszó nem egyezik' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        setApiError('');
        setSuccessMessage('');

        const {confirmPassword, ...profileData} = values;

        try {
            // NOTE: A fetch API hívás marad, ahogy kérted.
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
                   onClose={() => setApiError('')} mb="md" variant="light">
                <Stack gap="xs">
                    {messages.map((msg, i) => <Text key={i} size="sm">{msg}</Text>)}
                </Stack>
            </Alert>
        );
    };

    const inputStyles = {
        input: {
            background: 'rgba(15, 23, 42, 0.5)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
        }
    };

    return (
        <Container size={560} my={40}>
            <Title ta="center" fw={900} style={{
                background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem',
            }}>
                Fiók Létrehozása
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Már van fiókod?{' '}
                <Anchor size="sm" component="button" onClick={() => navigate('/login')}>
                    Jelentkezz be itt
                </Anchor>
            </Text>

            <Paper
                shadow="xl"
                p={30}
                mt={30}
                radius="md"
                withBorder
                style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
            >
                <Group gap="sm" mb="xl">
                    <ThemeIcon size="xl" radius="md" variant="light" color="cyan">
                        <IconUserPlus size={28}/>
                    </ThemeIcon>
                    <Box>
                        <Title order={3} size="h4">Regisztráció</Title>
                        <Text size="sm" c="dimmed">Hozd létre a fiókodat</Text>
                    </Box>
                </Group>

                <Divider mb="xl" opacity={0.1}/>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        {renderApiErrors()}
                        {successMessage && (
                            <Alert icon={<IconCheck size="1rem"/>} title="Siker!" color="green" mb="md" variant="light">
                                {successMessage}
                            </Alert>
                        )}

                        <Grid>
                            <Grid.Col span={{base: 12, sm: 6}}>
                                <TextInput withAsterisk label="Vezetéknév" placeholder="Minta"
                                           leftSection={<IconUser size={16}/>} {...form.getInputProps('lastName')}
                                           styles={inputStyles}/>
                            </Grid.Col>
                            <Grid.Col span={{base: 12, sm: 6}}>
                                <TextInput withAsterisk label="Keresztnév" placeholder="János"
                                           leftSection={<IconUser size={16}/>} {...form.getInputProps('firstName')}
                                           styles={inputStyles}/>
                            </Grid.Col>
                        </Grid>

                        <TextInput withAsterisk label="Felhasználónév" placeholder="minta.janos"
                                   leftSection={<IconUser size={16}/>} {...form.getInputProps('userName')}
                                   styles={inputStyles}/>
                        <TextInput withAsterisk label="E-mail cím" placeholder="pelda@email.com"
                                   leftSection={<IconAt size={16}/>} {...form.getInputProps('email')}
                                   styles={inputStyles}/>
                        <TextInput withAsterisk label="Lakcím" placeholder="1234 Város, Minta utca 1."
                                   leftSection={<IconHome size={16}/>} {...form.getInputProps('address')}
                                   styles={inputStyles}/>

                        <Group grow>
                            <TextInput label="Telefonszám" placeholder="+36 30 123 4567"
                                       leftSection={<IconPhone size={16}/>} {...form.getInputProps('phoneNumber')}
                                       styles={inputStyles}/>
                            <TextInput label="Jogosítvány azonosító" placeholder="AB123456"
                                       leftSection={<IconLicense size={16}/>} {...form.getInputProps('licenceId')}
                                       styles={inputStyles}/>
                        </Group>

                        <PasswordInput withAsterisk label="Jelszó" placeholder="Legalább 6 karakter"
                                       leftSection={<IconLock size={16}/>} {...form.getInputProps('password')}
                                       styles={inputStyles}/>
                        <PasswordInput withAsterisk label="Jelszó megerősítése" placeholder="Jelszó újra"
                                       leftSection={<IconLock size={16}/>} {...form.getInputProps('confirmPassword')}
                                       styles={inputStyles}/>

                        <Button
                            type="submit"
                            fullWidth
                            mt="xl"
                            loading={loading}
                            disabled={!!successMessage}
                            size="md"
                            style={{
                                background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                                fontWeight: 600,
                            }}
                        >
                            Regisztráció
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
};

export default Register;