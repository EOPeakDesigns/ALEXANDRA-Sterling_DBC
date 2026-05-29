/**
 * PWA bootstrap — capture install prompt + register service worker.
 * Must run in <head> before any other scripts.
 */
(function () {
  'use strict';

  window.__dbcDeferredPrompt = null;
  window.__dbcPwaReady = false;

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    window.__dbcDeferredPrompt = event;
    window.dispatchEvent(new Event('dbc-pwa-prompt-ready'));
  });

  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (window.location.protocol === 'file:') {
    return;
  }

  if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
    return;
  }

  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(function () { return navigator.serviceWorker.ready; })
    .then(function () {
      window.__dbcPwaReady = true;
      window.dispatchEvent(new Event('dbc-pwa-sw-ready'));
    })
    .catch(function (error) {
      console.warn('Service worker registration failed:', error);
    });
})();
