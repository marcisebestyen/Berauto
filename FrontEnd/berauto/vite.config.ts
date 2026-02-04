import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'https://localhost:7205',
                changeOrigin: true,
                secure: false
            }
        },
        port: 7285, // Change this to your desired port (e.g., 8080)
        open: true, // This will automatically open the browser
        host: 'localhost', // Optional: You can change the host if needed
    },
})