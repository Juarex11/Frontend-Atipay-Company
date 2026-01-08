import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory and all parent directories
  loadEnv(mode, process.cwd(), '')
  
  return {
    define: {
      'process.env': {}
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, './src') },
        { find: '@shared', replacement: path.resolve(__dirname, './src/shared') },
      ],
    },
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      // 1. Aumentamos el límite de advertencia a 1MB (1000 kB)
      chunkSizeWarningLimit: 1000,
      // 2. Configuración para dividir el código (Code Splitting)
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Si el código viene de la carpeta node_modules (librerías externas)...
            if (id.includes('node_modules')) {
              
              // Separamos el núcleo de React y Router
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }

              // Separamos librerías visuales pesadas (Iconos, Animaciones, UI)
              if (id.includes('lucide') || id.includes('radix') || id.includes('framer-motion') || id.includes('motion')) {
                return 'vendor-ui';
              }

              // Separamos utilidades pesadas (Gráficos, PDFs, Excel)
              if (id.includes('recharts') || id.includes('jspdf') || id.includes('html2canvas') || id.includes('xlsx')) {
                return 'vendor-utils';
              }

              // Todo lo demás va a un archivo general de librerías
              return 'vendor-libs';
            }
          },
        },
      },
    },
  }
})