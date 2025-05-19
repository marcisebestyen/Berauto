import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { Notifications } from '@mantine/notifications';

import { AuthProvider } from './context/AuthContext';
import Routing from './routing/Routing.tsx';

function App() {
    return (
        <MantineProvider defaultColorScheme="dark">
            <Notifications position="top-right" />
            <BrowserRouter>
                <AuthProvider>
                    <Routing />
                </AuthProvider>
            </BrowserRouter>
        </MantineProvider>
    );
}

export default App;
