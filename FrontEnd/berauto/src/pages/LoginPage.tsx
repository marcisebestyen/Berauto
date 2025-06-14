import { useState } from 'react';
import {
    Stack,
    TextInput,
    PasswordInput,
    Group,
    Button,
    Anchor,
    Divider,
    Center,
    Box,
    Text,
    Card
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.tsx";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        initialValues: {
            identifier: '',
            password: '',
        },
        validate: {
            identifier: (val: string) => !val ? 'Email vagy felhasználónév megadása kötelező' : null,
            password: (val: string) => !val
                ? 'A jelszó megadása kötelező'
                : val.length < 6
                    ? 'A jelszónak legalább 6 karakter hosszúnak kell lennie'
                    : null,
        },
    });

    const handleSubmit = async (data: { identifier: string; password: string }) => {
        if (!form.isValid()) return;

        setIsLoading(true);
        setLoginError(null);

        try {
            await login(data.identifier, data.password);
            navigate("/");
        } catch (error: any) {
            setLoginError(
                error.message || 'Bejelentkezési hiba történt. Kérjük próbálja újra.'
            );
            console.error("Bejelentkezési hiba:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: '100vh',
                backgroundColor: '#2d3748'
            }}
        >
            <Center>
                <Card
                    shadow="xl"
                    padding="xl"
                    radius="lg"
                    style={{ width: '100%', maxWidth: '450px', backgroundColor: '#fff' }}
                >
                    <div>
                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            marginBottom: '2rem',
                            color: '#2d3748',
                            textAlign: 'center'
                        }}>
                            Bérautó
                        </h2>
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="md">
                                <TextInput
                                    required
                                    label="Email vagy felhasználónév"
                                    placeholder="pelda@email.com vagy felhasznalonev"
                                    radius="md"
                                    size="md"
                                    disabled={isLoading}
                                    error={form.errors.identifier}
                                    {...form.getInputProps('identifier')}
                                />

                                <PasswordInput
                                    required
                                    label="Jelszó"
                                    placeholder="Adja meg jelszavát"
                                    radius="md"
                                    size="md"
                                    disabled={isLoading}
                                    error={form.errors.password}
                                    {...form.getInputProps('password')}
                                />
                            </Stack>

                            {loginError && (
                                <Text size="sm" mt="md" fw={500} c="red">
                                    {loginError}
                                </Text>
                            )}

                            <Group justify="space-between" mt="xl">
                                <Anchor
                                    component="button"
                                    type="button"
                                    c="dimmed"
                                    onClick={() => navigate('/forgot')}
                                    disabled={isLoading}
                                >
                                    Elfelejtett jelszó?
                                </Anchor>
                                <Button
                                    type="submit"
                                    radius="md"
                                    size="md"
                                    loading={isLoading}
                                    disabled={!form.isValid()}
                                >
                                    {isLoading ? 'Bejelentkezés...' : 'Bejelentkezés'}
                                </Button>
                            </Group>
                            <Divider my="lg" />
                        </form>
                    </div>
                </Card>
            </Center>
        </Box>
    );
};

export default Login;
