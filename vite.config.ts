import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: {
          overlay: true, // Show errors in overlay
          clientPort: 3000,
        },
        watch: {
          usePolling: false, // Disable polling untuk mengurangi CPU usage
          interval: 1000, // Interval checking lebih lambat
          // Debounce file change detection
          awaitWriteFinish: {
            stabilityThreshold: 1000,
            pollInterval: 100
          },
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/*.md',
            '**/*.sql',
            '**/*.txt',
            '**/*.sh',
            '**/*.ps1',
            '**/.github/**',
            '**/public/service-worker.js',
            '**/*.log',
            '**/package-lock.json',
          ]
        }
      },
      plugins: [react({
        // Optimize React Fast Refresh
        fastRefresh: true,
        // Exclude node_modules from refresh
        exclude: /node_modules/,
        // Optimize JSX runtime
        jsxRuntime: 'automatic',
      })],
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
        // Faster builds
        sourcemap: mode === 'development' ? 'cheap-module-source-map' : false,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'supabase': ['@supabase/supabase-js']
            }
          }
        }
      },
      // Optimize dependency pre-bundling
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
        exclude: ['@vite/client', '@vite/env'],
      },
      // Enable caching
      cacheDir: 'node_modules/.vite',
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
