'use client';

import { useEffect } from 'react';

export default function SwRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      }).catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
    }
  }, []);

  return null;
}
