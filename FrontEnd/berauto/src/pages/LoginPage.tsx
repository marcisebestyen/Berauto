import React, { useState } from 'react';
import {
    Stack,
    TextInput,
    PasswordInput,
    Group,
    Button,
    Anchor,
    Divider,
    Center,
    Container,
    Text
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import '@mantine/core/styles.css';
import AuthContainer from "../components/AuthContainer.tsx";
import useAuth from "../hooks/useAuth.tsx";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },

        validate: {
            email: (val: string) => (/^\S+@\S+$/.test(val) ? null : 'Érvénytelen e-mail cím'),
            password: (val: string) => (val.length <= 6 ? 'A jelszónak 6 karakter hosszúnak kell lennie.' : null),
        },
    });


    const submit = async (data: { email: string; password: string }) => {
        setIsLoading(true);
        setLoginError(null);
        try {
            // Simulate an API call (replace with your actual login logic)
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Simulate successful login
            if (data.email === 'test@example.com' && data.password === 'password123') {
                navigate('/dashboard'); // Use navigate for redirection
            } else {
                setLoginError('Invalid credentials');
                throw new Error('Invalid credentials');
            }

        } catch (error: any) {
            setLoginError(error.message);
            console.error("Login Failed", error)

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: '100vh' }}
        >
            <Center>
                <AuthContainer>
                    <div>
                        <form onSubmit={form.handleSubmit(submit)}>
                            <Stack>
                                <TextInput
                                    required
                                    label="E-mail cím"
                                    placeholder="hello@mantine.dev"
                                    key={form.key('email')}
                                    radius="md"
                                    size="xl"
                                    style={{ fontSize: '1.5rem' }}
                                    disabled={isLoading}
                                    {...form.getInputProps('email')}
                                />

                                <PasswordInput
                                    required
                                    label="Jelszó"
                                    placeholder="Jelszavad"
                                    key={form.key('password')}
                                    radius="md"
                                    size="xl"
                                    style={{ fontSize: '1.5rem' }}
                                    disabled={isLoading}
                                    {...form.getInputProps('password')}
                                />
                            </Stack>
                            {loginError && (
                                <Text color="red" size="sm" mt="md">
                                    {loginError}
                                </Text>
                            )}

                            <Group justify="space-between" mt="xl">
                                <Anchor
                                    component="button"
                                    type="button"
                                    c="dimmed"
                                    onClick={() => navigate('/forgot')}
                                    size="lg"
                                    style={{ fontSize: '1.2rem' }}
                                    disabled={isLoading}
                                >
                                    Elfelejtetted a jelszavad?
                                </Anchor>
                                <Button
                                    type="submit"
                                    radius="xl"
                                    size="xl"
                                    style={{ fontSize: '1.5rem', padding: '1.2rem 2.5rem' }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Loading...' : 'Bejelentkezés'}
                                </Button>
                            </Group>
                            <Divider my="lg" />
                        </form>
                    </div>
                </AuthContainer>
            </Center>
        </Container>
    );
}

export default Login;
