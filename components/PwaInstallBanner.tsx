'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): void;
  userChoice: Promise<{ outcome: string }>;
}

const TERRACOTTA = 'oklch(57% 0.14 40)';
const DISMISS_KEY = 'pwa-install-dismissed';

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    ('standalone' in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    if (isIos()) {
      const timeout = window.setTimeout(() => setShowIosBanner(true), 0);
      return () => window.clearTimeout(timeout);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as BeforeInstallPromptEvent;
    prompt.prompt();
    await prompt.userChoice;
    setShowBanner(false);
    setDeferredPrompt(null);
  }

  function dismiss() {
    setShowBanner(false);
    setShowIosBanner(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }

  if (!showBanner && !showIosBanner) return null;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    maxWidth: '28rem',
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  const cardBase: React.CSSProperties = {
    margin: '0.75rem',
    borderRadius: '1rem',
    padding: '1rem',
    backgroundColor: TERRACOTTA,
    color: '#ffffff',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
  };

  const pillButton: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '9999px',
    color: '#ffffff',
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  const closeButton: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '0.25rem',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  if (showBanner) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardBase, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '2rem', flexShrink: 0 }}
            aria-hidden="true"
          >
            install_mobile
          </span>
          <p style={{ flex: 1, margin: 0, fontSize: '0.875rem', lineHeight: '1.4' }}>
            Installeer Notre Voyage op je telefoon voor offline toegang
          </p>
          <button style={pillButton} onClick={install}>
            Installeren
          </button>
          <button style={closeButton} onClick={dismiss} aria-label="Sluiten">
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
              close
            </span>
          </button>
        </div>
      </div>
    );
  }

  // iOS banner
  return (
    <div style={containerStyle}>
      <div style={cardBase}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flex: 1 }}>
            <span style={{ fontSize: '1.5rem' }} aria-hidden="true">📱</span>
            <div>
              <p style={{ margin: '0 0 0.35rem', fontWeight: 700, fontSize: '0.9375rem' }}>
                Notre Voyage offline beschikbaar maken
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5' }}>
                Tik op{' '}
                <span
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '0.25rem',
                    padding: '0.1rem 0.35rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  deelicoon ⬆
                </span>{' '}
                en kies &lsquo;Zet op beginscherm&rsquo;
              </p>
            </div>
          </div>
          <button style={closeButton} onClick={dismiss} aria-label="Sluiten">
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
              close
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
