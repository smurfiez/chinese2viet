import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Production only: in dev, Vite HMR and an SW cache fight each other.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      // Resolved from baseURI so it keeps working with Vite's base: './'.
      const swUrl = new URL('./sw.js', document.baseURI).href;
      const scope = new URL('./', document.baseURI).pathname;
      navigator.serviceWorker.register(swUrl, { scope }).catch(() => {});
    } catch {
      /* registration is best-effort; the app works without it */
    }
  });
}
