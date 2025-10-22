import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { Notifications } from '@mantine/notifications';

import { AuthProvider } from './context/AuthContext';
import Routing from './routing/Routing.tsx';
import ChatbotWidget from './components/ChatbotWidget';

function App() {
    return (
        <MantineProvider defaultColorScheme="dark">
            <Notifications position="top-right" />
            <BrowserRouter>
                <AuthProvider>
                    <Routing />
                    <ChatbotWidget />
                </AuthProvider>
            </BrowserRouter>
        </MantineProvider>
    );
}

export default App;