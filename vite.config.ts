import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        watch: {
          usePolling: false, // Disable polling untuk mengurangi CPU usage
          interval: 1000, // Interval checking lebih lambat
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/*.md',
            '**/*.sql',
            '**/*.txt',
            '**/*.sh',
            '**/*.ps1',
          ]
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      build: {
        // Production optimizations
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production', // Remove console.* in production
            drop_debugger: true,
            pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : []
          }
        },
        // Optimize chunk size
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'supabase': ['@supabase/supabase-js']
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
