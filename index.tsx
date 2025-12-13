
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ⛔ Disable browser's default notification permission requests
// We use our custom notification system from the database instead

// Disable service worker if it exists (prevents push notifications)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister().catch(() => {
        // Service worker cleanup
      });
    });
  }).catch(() => {
    // Service worker check
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
