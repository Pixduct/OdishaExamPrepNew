import './lib/capacitorShim';
import {StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import LoadingPortal from './components/LoadingPortal';
import { applyThemeToDocument, getStoredTheme } from './lib/themeStore';
import { LanguageProvider, applyLanguageToDocument, getStoredLanguage } from './lib/LanguageContext';
import { registerServiceWorker } from './lib/pushNotifications';
import { initLenis } from './lib/lenisScroll';

// Ensure dark/light theme and language are synchronously applied to HTML root before React mounts
applyThemeToDocument(getStoredTheme());
applyLanguageToDocument(getStoredLanguage());

// Initialize 0ms Universal Smooth Scrolling Engine immediately on bootstrap
if (typeof window !== 'undefined') {
  initLenis();
}

// Bootstrap Service Worker for PWA installability and push notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerServiceWorker().catch((err) => {
    console.warn('[PWA] Service worker registration failed on bootstrap:', err);
  });
}

function shouldReportError(msg: string, stack?: string): boolean {
  if (!msg) return false;
  const str = (msg + ' ' + (stack || '')).toLowerCase();
  return !(
    str.includes('websocket') ||
    str.includes('@vite/client') ||
    str.includes('resizeobserver') ||
    str.includes('script error') ||
    str.includes('extension') ||
    str.includes('failed to fetch') ||
    str.includes('networkerror') ||
    str.includes('aborterror') ||
    str.includes('signal is aborted')
  );
}

// Global client-side error reporter for remote diagnostics
window.onerror = function(message, source, lineno, colno, error) {
  const msgStr = message ? message.toString() : '';
  const stackStr = error?.stack || '';
  if (!shouldReportError(msgStr, stackStr)) return;

  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'onerror',
      message: msgStr,
      source,
      lineno,
      colno,
      stack: stackStr
    })
  }).catch(() => {});
};

window.addEventListener('unhandledrejection', function(event) {
  const reasonStr = event.reason ? (event.reason.message || event.reason.toString()) : '';
  const stackStr = event.reason?.stack || '';
  if (!shouldReportError(reasonStr, stackStr)) return;

  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'unhandledrejection',
      message: 'Unhandled Promise Rejection',
      reason: reasonStr,
      stack: stackStr
    })
  }).catch(() => {});
});

// Handle dynamic import (chunk) loading failures gracefully
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite Preload Error] Failed to fetch dynamic asset. Reloading to apply update...');
  const lastReload = sessionStorage.getItem('oep_last_chunk_reload');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload) > 15000) {
    sessionStorage.setItem('oep_last_chunk_reload', now.toString());
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <Suspense fallback={<LoadingPortal />}>
            <App />
          </Suspense>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
