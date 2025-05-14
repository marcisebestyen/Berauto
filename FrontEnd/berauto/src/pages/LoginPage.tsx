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
    Box,
    Text,
    Card
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import '@mantine/core/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import useAuth from "../hooks/useAuth.tsx";

// Define a dark theme
const darkTheme = createTheme({
    primaryColor: 'blue', // You can customize this
    colors: {
        dark: [
            '#2b3440',
            '#343d4a',
            '#3d4857',
            '#465362',
            '#576270',
            '#64748b',
            '#8696a7',
            '#94a3b8',
            '#cbd5e0',
            '#e2e8f0',
        ],
    },
    fontFamily: 'Inter, sans-serif', // set the font here
    components: {
        Card: {
            styles: {
                root: {
                    backgroundColor: '#343d4a', // Dark background for the card
                    border: '1px solid #4a5568',  // Darker border color
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)', // Stronger shadow
                },
            },
        },
        TextInput: {
            styles: {
                input: {
                    backgroundColor: '#4a5568', // Dark background for inputs
                    color: '#fff',             // White text color
                    border: '1px solid #718096',  // Darker border
                    '&:focus': {
                        borderColor: '#90caf9', // Lighter blue on focus
                        boxShadow: '0 0 0 2px rgba(144, 202, 249, 0.2)',
                    },
                    '&::placeholder': {
                        color: '#a0aec0',       // Darker placeholder color
                    },
                },
                label: {
                    color: '#cbd5e0',          // Lighter label color
                },
            },
        },
        PasswordInput: {
            styles: {
                input: {
                    backgroundColor: '#4a5568',
                    color: '#fff',
                    border: '1px solid #718096',
                    '&:focus': {
                        borderColor: '#90caf9',
                        boxShadow: '0 0 0 2px rgba(144, 202, 249, 0.2)',
                    },
                    '&::placeholder': {
                        color: '#a0aec0',
                    },
                },
                label: {
                    color: '#cbd5e0',
                },
            },
        },
        Button: {
            styles: {
                root: {
                    backgroundColor: '#4299e1', // Blue button color
                    color: '#fff',
                    '&:hover': {
                        backgroundColor: '#3182ce', // Darker blue on hover
                    },
                },
            },
        },
        Anchor: {
            styles: {
                root: {
                    color: '#a0aec0', // Lighter color for "Forgot password"
                    '&:hover': {
                        color: '#f56565',  // Red on hover
                    },
                },
            },
        },
        Divider: {
            styles: {
                root: {
                    backgroundColor: '#718096', // Darker divider
                },
            },
        },
        Text: {
            styles: {
                root: {
                    color: '#fff', // Default text color
                }
            }
        }
    },
});


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
            email: (val: string) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
            password: (val: string) => (val.length <= 6 ? 'Password should have at least 6 characters' : null),
        }
    });


    const handleSubmit = async (data: { email: string; password: string }) => {
        setIsLoading(true);
        setLoginError(null);
        try {
            // Use the login function from useAuth.
            await login(data.email,data.password);
            // If login() doesn't throw an error, we assume it's successful.
            navigate('/dashboard'); // Redirect on success

        } catch (error: any) {
            setLoginError(error.message); // Set the error message
            console.error("Login Failed", error);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MantineProvider theme={darkTheme}>
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
                        shadow="xl" // Stronger shadow
                        padding="xl"
                        radius="lg"
                        style={{ width: '100%', maxWidth: '450px' }}
                    >
                        <div>
                            <h2 style={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                marginBottom: '2rem',
                                color: '#fff',     // White heading
                                textAlign: 'center'
                            }}>
                                Bérautó
                            </h2>
                            <form onSubmit={form.onSubmit(handleSubmit)}>
                                <Stack>
                                    <TextInput
                                        required
                                        label="Email"
                                        placeholder="hello@example.com"
                                        radius="md"
                                        size="xl"
                                        style={{ fontSize: '1.2rem' }}
                                        disabled={isLoading}
                                        {...form.getInputProps('email')}
                                    />

                                    <PasswordInput
                                        required
                                        label="Password"
                                        placeholder="Your password"
                                        radius="md"
                                        size="xl"
                                        style={{ fontSize: '1.2rem' }}
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
                                        style={{ fontSize: '1rem' }}
                                        disabled={isLoading}
                                    >
                                        Forgot your password?
                                    </Anchor>
                                    <Button
                                        type="submit"
                                        radius="xl"
                                        size="xl"
                                        style={{ fontSize: '1.2rem', padding: '0.75rem 2rem' }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Loading...' : 'Login'}
                                    </Button>
                                </Group>
                                <Divider my="lg" />
                            </form>
                        </div>
                    </Card>
                </Center>
            </Box>
        </MantineProvider>
    );
}

export default Login;
