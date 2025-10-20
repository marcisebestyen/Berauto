import {useState} from 'react';
import {
    Stack,
    TextInput,
    PasswordInput,
    Group,
    Button,
    Anchor,
    Paper,
    Title,
    Text,
    Container,
    Alert,
} from "@mantine/core";
import {useForm} from "@mantine/form";
import {useNavigate} from "react-router-dom";
import {IconAt, IconLock, IconAlertCircle} from '@tabler/icons-react';
import useAuth from "../hooks/useAuth.tsx";

const Login = () => {
    const {login} = useAuth();
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        initialValues: {identifier: '', password: ''},
        validate: {
            identifier: (val) => !val ? 'Email vagy felhasználónév megadása kötelező' : null,
            password: (val) => val.length < 6 ? 'A jelszónak legalább 6 karakter hosszúnak kell lennie' : null,
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setIsLoading(true);
        setLoginError(null);
        try {
            await login(values.identifier, values.password);
            navigate("/"); // Redirect on success
        } catch (error: any) {
            setLoginError(error.message || 'Helytelen bejelentkezési adatok.');
            console.error("Bejelentkezési hiba:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">
                Üdvözlünk újra!
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Még nincs fiókod?{' '}
                <Anchor size="sm" component="button" onClick={() => navigate('/register')}>
                    Regisztrálj itt
                </Anchor>
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        {loginError && (
                            <Alert
                                icon={<IconAlertCircle size="1rem"/>}
                                title="Bejelentkezési Hiba"
                                color="red"
                                withCloseButton
                                onClose={() => setLoginError(null)}
                            >
                                {loginError}
                            </Alert>
                        )}

                        <TextInput
                            required
                            label="Email vagy felhasználónév"
                            placeholder="pelda@email.com"
                            leftSection={<IconAt size={16}/>}
                            disabled={isLoading}
                            {...form.getInputProps('identifier')}
                        />

                        <PasswordInput
                            required
                            label="Jelszó"
                            placeholder="Jelszavad"
                            leftSection={<IconLock size={16}/>}
                            disabled={isLoading}
                            {...form.getInputProps('password')}
                        />

                        <Group justify="flex-end" mt="sm">
                            <Anchor component="button" size="sm" c="dimmed" onClick={() => navigate('/forgot')}>
                                Elfelejtetted a jelszavad?
                            </Anchor>
                        </Group>

                        <Button type="submit" fullWidth mt="xl" loading={isLoading}>
                            Bejelentkezés
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
};

export default Login;