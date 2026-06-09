import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '127.0.0.1', // Force l'utilisation de l'IPv4 locale au lieu de l'IPv6 (::1) pour éviter l'erreur EACCES
        port: 3000, // Utilise le port 3000, souvent plus libre et accessible sous Windows
        open: true // Ouvre automatiquement le projet dans ton navigateur au démarrage
    }
})