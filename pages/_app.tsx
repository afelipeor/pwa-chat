import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../styles/globals.css';

// Suppress development noise
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const message = String(args[0]);
    if (
      message.includes('Fast Refresh') ||
      message.includes('webpack-hmr') ||
      message.includes('devtools') ||
      message.includes('well-known') ||
      message.includes('404')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = String(args[0]);
    if (
      message.includes('Fast Refresh') ||
      message.includes('webpack') ||
      message.includes('devtools')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Prevent unnecessary network requests in development
    if (process.env.NODE_ENV === 'development') {
      const originalFetch = window.fetch;

      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;

        // Block known development noise requests
        if (
          url.includes('.well-known/') ||
          url.includes('webpack-hmr') ||
          url.includes('devtools')
        ) {
          return new Response(null, { status: 204 });
        }

        return originalFetch(input, init);
      };
    }
  }, []);

  return <Component {...pageProps} />;
}
