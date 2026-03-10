import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';
import { initElectronShim } from './services/electronShim';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Initialize electron shim before rendering
initElectronShim()
  .then(() => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Failed to initialize app:', error);
    // Render anyway with error display
    ReactDOM.createRoot(rootElement).render(
      <div className="flex items-center justify-center h-screen bg-red-50 dark:bg-red-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-300 mb-4">Failed to Initialize</h1>
          <p className="text-red-500 dark:text-red-400">{String(error)}</p>
        </div>
      </div>
    );
  });
