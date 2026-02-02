import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['safari >= 11', 'ios >= 11'],
      additionalLegacyPolyfills: [
        'regenerator-runtime/runtime'
      ],
      renderLegacyChunks: true,
      polyfills: [
        'es.promise',
        'es.promise.all-settled',
        'es.promise.finally',
        'es.array.iterator',
        'es.object.assign',
        'es.array.includes',
        'es.array.find',
        'es.array.find-index',
        'es.array.flat',
        'es.array.flat-map',
        'es.string.includes',
        'es.string.starts-with',
        'es.string.ends-with',
        'es.object.entries',
        'es.object.values',
        'es.object.from-entries',
        'es.symbol',
        'es.symbol.async-iterator',
        'web.queue-microtask'
      ],
      modernPolyfills: true,
      // Ensure node_modules are also transpiled
      modernTargets: 'defaults',
      renderModernChunks: true,
    }),
  ],
  build: {
    target: ['es2015', 'safari11'],
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
