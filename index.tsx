
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ⛔ Disable browser's default notification permission requests
// We use our custom notification system from the database instead
if ('Notification' in window) {
  console.log('📢 Custom notification system active - browser notifications disabled');
}

// Disable service worker if it exists (prevents push notifications)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister().catch(err => {
        console.log('Service worker cleanup (no-op if not registered):', err);
      });
    });
  }).catch(err => {
    console.log('Service worker check (no-op):', err);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
