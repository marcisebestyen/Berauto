import '@mantine/core/styles.css';      // Mantine alap stílusok (ez valószínűleg már megvan)
import '@mantine/dates/styles.css';   // <-- DÁTUMKOMPONENSEK STÍLUSAI (EZ LEHET, HOGY HIÁNYZIK)
import '@mantine/notifications/styles.css';// Ezt is hozzá kell adni
import { useState } from 'react';
import { BrowserRouter} from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { AuthContext } from './context/AuthContext';
import useAuthHook from './hooks/useAuth';
import { emailKeyName, tokenKeyName } from './constants/constants';
import Routing from "./routing/Routing.tsx";
import { Notifications } from '@mantine/notifications';

function App() {
    const { } = useAuthHook();

    const [token, setToken] = useState<string | null>(localStorage.getItem(tokenKeyName));
    const [email, setEmail] = useState<string | null>(localStorage.getItem(emailKeyName));

    return (
        <MantineProvider defaultColorScheme={"dark"}>
            <Notifications position="top-right" />
            <BrowserRouter>
                <AuthContext.Provider value={{ token, setToken, email, setEmail }}>
                    <Routing/>
                </AuthContext.Provider>
            </BrowserRouter>
        </MantineProvider>
    );
}

export default App;