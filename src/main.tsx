import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { preloadPackages } from './lib/preload'
import { applySafariFixes } from './lib/safariDetect'
import { initializeRuntimeErrorHandling, checkBrowserCompatibility } from './lib/runtimeErrorHandling'

// Initialize runtime error handling first (critical for Safari 11-12)
initializeRuntimeErrorHandling();

// Check browser compatibility and log warnings
checkBrowserCompatibility();

// Apply Safari/iOS fixes immediately
applySafariFixes();

// Preload packages immediately
preloadPackages();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
