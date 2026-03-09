/**
 * Web Entry Point for LobsterAI
 * Initializes the React app with Redux and Router
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store';
import App from './App';
import { initElectronShim } from '../renderer/services/electronShim';
import '../renderer/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

try {
  // Initialize electron shim and connect WebSocket
  initElectronShim().catch((error) => {
    console.error('[Web Entry] Failed to initialize electron shim:', error);
  });

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </React.StrictMode>
  );
  console.log('[Web Entry] LobsterAI web version initialized');
} catch (error) {
  console.error('Failed to render the app:', error);
}
