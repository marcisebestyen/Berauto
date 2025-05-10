import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7269, // Change this to your desired port (e.g., 8080)
    open: true, // This will automatically open the browser
    host: 'localhost', // Optional: You can change the host if needed
  },
})