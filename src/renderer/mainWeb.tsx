/**
 * Web Entry Point for LobsterAI
 * Initializes the Electron shim before starting the React app
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { initElectronShim } from './services/electronShim';
import App from './App';
import './index.css';

/**
 * Initialize and mount the app
 */
async function main(): Promise<void> {
  // Initialize the Electron shim first
  // This replaces window.electron with our web-compatible implementation
  try {
    await initElectronShim();
  } catch (error) {
    console.error('[Web Entry] Failed to initialize electron shim:', error);
    // Continue anyway - some features may not work
  }

  // Mount React app
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log('[Web Entry] LobsterAI web version initialized');
}

// Start the app
main().catch((error) => {
  console.error('[Web Entry] Fatal error during initialization:', error);
});
