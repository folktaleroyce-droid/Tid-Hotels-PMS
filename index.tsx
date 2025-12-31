
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Added file extension to App import.
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { HotelDataProvider } from './contexts/HotelDataContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <HotelDataProvider>
          <App />
        </HotelDataProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
