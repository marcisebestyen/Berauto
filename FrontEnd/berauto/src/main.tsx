import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';

import App from './App'; // Import your App component

import { MantineProvider} from '@mantine/core';



function Demo() {
    return (
        <MantineProvider defaultColorScheme="dark">
            <App />
        </MantineProvider>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Demo />
    </React.StrictMode>
);
