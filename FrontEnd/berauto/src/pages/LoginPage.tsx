import { useState, useEffect } from 'react';
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
    ThemeIcon,
    Box,
    Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import { IconAt, IconLock, IconAlertCircle, IconLogin, IconBrandGoogle } from '@tabler/icons-react';
import useAuth from "../hooks/useAuth.tsx";
import { supabase } from "../utils/supabaseClient";

const Login = () => {
    const { login } = useAuth();

    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await finishGoogleLoginOnBackend(session.access_token);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            setLoginError(error.message);
            setIsLoading(false);
        }
    };

    const finishGoogleLoginOnBackend = async (supabaseToken: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('https://localhost:7205/api/users/google-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ accessToken: supabaseToken })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.Message || "Szerver oldali hiba történt.");
            }

            localStorage.setItem('token', data.token);

            navigate("/");

        } catch (error: any) {
            console.error("Backend hiba:", error);
            setLoginError(error.message || "Nem sikerült a bejelentkezés a szerveren.");
            await supabase.auth.signOut();
        } finally {
            setIsLoading(false);
        }
    };

    const form = useForm({
        initialValues: { identifier: '', password: '' },
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
            navigate("/");
        } catch (error: any) {
            const message = error.response?.data?.message ||
                error.response?.data?.Message ||
                error.message ||
                'Helytelen bejelentkezési adatok.';
            setLoginError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center" fw={900} style={{
                background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem',
            }}>
                Üdvözlünk újra!
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Még nincs fiókod?{' '}
                <Anchor size="sm" component="button" onClick={() => navigate('/register')}>
                    Regisztrálj itt
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
                        <IconLogin size={28}/>
                    </ThemeIcon>
                    <Box>
                        <Title order={3} size="h4">Bejelentkezés</Title>
                        <Text size="sm" c="dimmed">Jelentkezz be a fiókodba</Text>
                    </Box>
                </Group>

                <Divider mb="xl" opacity={0.1}/>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        {loginError && (
                            <Alert
                                icon={<IconAlertCircle size="1rem"/>}
                                title="Bejelentkezési Hiba"
                                color="red"
                                withCloseButton
                                onClose={() => setLoginError(null)}
                                variant="light"
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
                            styles={{
                                input: {
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                }
                            }}
                            {...form.getInputProps('identifier')}
                        />

                        <PasswordInput
                            required
                            label="Jelszó"
                            placeholder="Jelszavad"
                            leftSection={<IconLock size={16}/>}
                            disabled={isLoading}
                            styles={{
                                input: {
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                }
                            }}
                            {...form.getInputProps('password')}
                        />

                        <Group justify="flex-end" mt="sm">
                            <Anchor component="button" size="sm" c="dimmed" onClick={() => navigate('/forgot')}>
                                Elfelejtetted a jelszavad?
                            </Anchor>
                        </Group>

                        <Button
                            type="submit"
                            fullWidth
                            mt="xl"
                            loading={isLoading}
                            size="md"
                            style={{
                                background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                                fontWeight: 600,
                            }}
                        >
                            Bejelentkezés
                        </Button>
                    </Stack>
                </form>
                <Divider label="Vagy folytasd ezzel" labelPosition="center" my="lg" />

                <Button
                    fullWidth
                    variant="default"
                    leftSection={<IconBrandGoogle size={20} />}
                    onClick={handleGoogleLogin}
                    loading={isLoading}
                    styles={{
                        root: {
                            backgroundColor: 'white',
                            color: 'black',
                            '&:hover': {
                                backgroundColor: '#f1f3f5'
                            }
                        }
                    }}
                >
                    Bejelentkezés Google fiókkal
                </Button>

            </Paper>
        </Container>
    );
};

export default Login;