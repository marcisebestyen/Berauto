import '@mantine/core/styles.css';
import { useState } from 'react';
import { BrowserRouter} from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { AuthContext } from './context/AuthContext';
import useAuthHook from './hooks/useAuth'; // Corrected import path
import { emailKeyName, tokenKeyName } from './constants/constants';
import Routing from "./routing/Routing.tsx";



function App() {
    const { } = useAuthHook();

    const [token, setToken] = useState<string | null>(localStorage.getItem(tokenKeyName));
    const [email, setEmail] = useState<string | null>(localStorage.getItem(emailKeyName));

    return (
        <MantineProvider defaultColorScheme={"dark"}>
            <BrowserRouter>
                <AuthContext.Provider value={{ token, setToken, email, setEmail }}>
                    <Routing/>
                </AuthContext.Provider>
            </BrowserRouter>
        </MantineProvider>
    );
}

export default App;
