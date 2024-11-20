import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {copyFileSync} from 'fs';
import {resolve} from 'path';
import {viteStaticCopy} from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: 'index.html', // Entrada principal para la aplicación
                background: 'src/background.ts', // Entrada para el script de background
            },
            output: {
                entryFileNames: '[name].js'
            }
        }
    },
    plugins: [react(),
        viteStaticCopy({
            targets: [
                {
                    src: 'manifest.json',
                    dest: '.',
                },{
                    src: 'icons/', // Copia el manifest.json al directorio dist
                    dest: '.',
                },
            ],
        }),
    ],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
});

