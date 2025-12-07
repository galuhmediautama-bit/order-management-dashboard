
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setGlobalDialogInstance } from './utils/globalDialogs';

// ⛔ Disable browser's default notification permission requests
// We use our custom notification system from the database instead
if ('Notification' in window) {
  // Don't request permission
  // User will see notifications through our custom header badge system
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

// 🔒 Setup global dialog interception - will be configured after DialogProvider mounts
// Create a wrapper component to capture dialog context
const RootApp = () => {
  const [dialogReady, setDialogReady] = React.useState(false);

  React.useEffect(() => {
    // Signal that app is ready to intercept dialogs
    // The DialogProvider will set up the global instance
    setDialogReady(true);
  }, []);

  return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
