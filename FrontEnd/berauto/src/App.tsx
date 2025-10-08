import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { Notifications } from '@mantine/notifications';

import { AuthProvider } from './context/AuthContext';
import Routing from './routing/Routing.tsx';
import ChatbotWidget from './components/ChatbotWidget'; // <-- 1. Import your widget

function App() {
    return (
        <MantineProvider defaultColorScheme="dark">
            <Notifications position="top-right" />
            <BrowserRouter>
                <AuthProvider>
                    {/* The content that changes (your routes) */}
                    <Routing />

                    {/* 2. Place it here! */}
                    {/* It will render on every page, and the Affix component
                        within it will handle the fixed positioning. */}
                    <ChatbotWidget />
                </AuthProvider>
            </BrowserRouter>
        </MantineProvider>
    );
}

export default App;