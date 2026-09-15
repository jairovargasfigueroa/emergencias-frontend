import { tamaguiPlugin } from '@tamagui/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // El plugin de Tamagui define su propio prefijo de variables; sin esta línea se pierden las VITE_*.
  envPrefix: ['VITE_'],
  plugins: [
    react(),
    tamaguiPlugin({
      config: './src/tamagui.config.ts',
      components: ['tamagui'],
      disableExtraction: true,
    }),
  ],
  server: {
    // En desarrollo el panel llama a /api y Vite lo reenvía al backend, así no hace falta CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (ruta) => ruta.replace(/^\/api/, ''),
      },
    },
  },
})
