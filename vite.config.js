import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Incrusta todo el JS y CSS dentro del HTML generado.
    // El resultado es un único dist/index.html autocontenido que funciona
    // como file:// en Chrome, igual que el index.html original vanilla.
    viteSingleFile(),
  ],
  base: './',
  build: {
    // Necesario para que vite-plugin-singlefile funcione correctamente
    cssCodeSplit: false,
  },
})
