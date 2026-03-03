import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to catch unhandled rejections and log them as strings
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : JSON.stringify(reason);
  console.error('Unhandled Promise Rejection:', message, reason);
});

window.addEventListener('error', (event) => {
  const message = event.error instanceof Error ? event.error.message : JSON.stringify(event.error);
  console.error('Global Error:', message, event.error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
