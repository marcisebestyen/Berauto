import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { AuthContext } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import useAuthHook from './hooks/useAuth'; // Corrected import path
import { emailKeyName, tokenKeyName } from './constants/constants';

const theme = createTheme({});

function App() {
    const auth = useAuthHook();

    const [token, setToken] = useState<string | null>(localStorage.getItem(tokenKeyName));
    const [email, setEmail] = useState<string | null>(localStorage.getItem(emailKeyName));

    return (
        <MantineProvider theme={theme}>
            <BrowserRouter>
                <AuthContext.Provider value={{ token, setToken, email, setEmail }}>
                    <Routes>
                        <Route path="/" element={<LoginPage />} />
                        {/* Define other routes as needed */}
                    </Routes>
                </AuthContext.Provider>
            </BrowserRouter>
        </MantineProvider>
    );
}

export default App;
