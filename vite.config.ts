import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'safari >= 11', 'ios >= 11'],
      additionalLegacyPolyfills: [
        'regenerator-runtime/runtime',
        'core-js/modules/web.queue-microtask',
        'core-js/modules/es.global-this',
      ],
      renderLegacyChunks: true,
      // Detect polyfills used by the app AND dependencies instead of a partial list.
      polyfills: true,
      modernPolyfills: true,
      // Safari 12 passes the plugin's modern-browser check. Its bundle must
      // therefore be transpiled for Safari 12, even when Browserslist moves on.
      modernTargets: ['edge >= 79', 'firefox >= 67', 'chrome >= 64', 'safari >= 12', 'ios >= 12'],
      renderModernChunks: true,
    }),
  ],
  build: {
    cssTarget: 'safari11',
    minify: 'terser',
    terserOptions: {
      safari10: true,
      compress: {
        arrows: false,
        keep_fnames: true
      },
      format: {
        // Ensure no ES2016+ syntax in output
        ecma: 2015,
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
        },
      },
    },
    // Ensure all dependencies are transpiled
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    esbuildOptions: {
      target: 'es2015',
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
})
