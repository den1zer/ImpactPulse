import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function PWAReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('PWA Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('PWA Service Worker registration error:', error);
    }
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="pwa-reload-prompt-overlay" role="alert" aria-live="assertive">
      <style>{`
        .pwa-reload-prompt-overlay {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          max-width: 380px;
          width: calc(100vw - 48px);
          animation: pwaSlideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .pwa-reload-card {
          background-color: var(--bg-surface, #ffffff);
          border: 3px solid var(--black, #000000);
          box-shadow: 6px 6px 0px 0px var(--black, #000000);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.15s ease;
        }
        .pwa-reload-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pwa-reload-icon {
          background-color: var(--accent, #5B1FA0);
          color: var(--accent-text, #ffffff);
          border: 2px solid var(--black, #000000);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1rem;
          box-shadow: 2px 2px 0px 0px var(--black, #000000);
        }
        .pwa-reload-title {
          font-family: var(--font-sans), sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--black, #000000);
          text-transform: uppercase;
          letter-spacing: -0.01em;
        }
        .pwa-reload-message {
          font-family: var(--font-sans), sans-serif;
          font-size: 0.88rem;
          line-height: 1.5;
          color: var(--black, #000000);
        }
        .pwa-reload-actions {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        .pwa-reload-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          font-family: var(--font-sans), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 2px solid var(--black, #000000);
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .pwa-reload-btn-update {
          background-color: var(--accent, #5B1FA0);
          color: var(--accent-text, #ffffff) !important;
          box-shadow: 3px 3px 0px 0px var(--black, #000000);
        }
        .pwa-reload-btn-update:hover {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px 0px var(--black, #000000);
        }
        .pwa-reload-btn-close {
          background-color: var(--bg-subtle, #EBEBEA);
          color: var(--black, #000000);
          box-shadow: 3px 3px 0px 0px var(--black, #000000);
        }
        .pwa-reload-btn-close:hover {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px 0px var(--black, #000000);
        }
        @keyframes pwaSlideUp {
          from {
            transform: translateY(100px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @media (max-width: 480px) {
          .pwa-reload-prompt-overlay {
            bottom: 16px;
            right: 24px;
            left: 24px;
            width: calc(100vw - 48px);
            max-width: none;
          }
        }
      `}</style>
      <div className="pwa-reload-card">
        <div className="pwa-reload-header">
          <div className="pwa-reload-icon">🔄</div>
          <div className="pwa-reload-title">Оновлення</div>
        </div>
        <div className="pwa-reload-message">
          Доступна нова версія додатку <strong>ImpactPulse</strong>! Бажаєте оновити сторінку, щоб застосувати зміни?
        </div>
        <div className="pwa-reload-actions">
          <button 
            type="button" 
            className="pwa-reload-btn pwa-reload-btn-update"
            onClick={() => updateServiceWorker(true)}
          >
            Оновити
          </button>
          <button 
            type="button" 
            className="pwa-reload-btn pwa-reload-btn-close"
            onClick={close}
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}

export default PWAReloadPrompt;
