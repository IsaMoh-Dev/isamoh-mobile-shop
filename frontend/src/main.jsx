import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import App from './App';
import ErrorBoundary       from './components/ErrorBoundary';
import { AuthProvider }     from './context/AuthContext';
import { CartProvider }     from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider }    from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './styles/main.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:              1,
      staleTime:          5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <CurrencyProvider>
                  <CartProvider>
                    <App />
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 3500,
                        style: { fontFamily: "'Rubik', sans-serif", fontSize: '14px' },
                        success: { iconTheme: { primary: '#00A5C4', secondary: '#fff' } },
                      }}
                    />
                  </CartProvider>
                </CurrencyProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
