/**
 * PWA bootstrap — must run first in <head>.
 * Captures install prompt + registers service worker + one-time SW bootstrap reload.
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

  var hadControllerAtStart = Boolean(navigator.serviceWorker.controller);

  function markSwBooted() {
    try {
      sessionStorage.setItem('dbc-sw-boot', '1');
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function shouldBootstrapReload() {
    if (window.__dbcDeferredPrompt) {
      return false;
    }

    try {
      return sessionStorage.getItem('dbc-sw-boot') !== '1';
    } catch (error) {
      return false;
    }
  }

  function maybeBootstrapReload() {
    if (hadControllerAtStart || window.__dbcDeferredPrompt || !shouldBootstrapReload()) {
      return;
    }

    markSwBooted();
    window.location.reload();
  }

  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(function (registration) {
      if (!hadControllerAtStart && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      if (!hadControllerAtStart && registration.installing) {
        registration.installing.addEventListener('statechange', function () {
          if (registration.installing && registration.installing.state === 'activated') {
            maybeBootstrapReload();
          }
        });
      }

      return navigator.serviceWorker.ready;
    })
    .then(function () {
      window.__dbcPwaReady = true;
      window.dispatchEvent(new Event('dbc-pwa-sw-ready'));

      if (!hadControllerAtStart && !navigator.serviceWorker.controller) {
        maybeBootstrapReload();
      }
    })
    .catch(function (error) {
      console.warn('Service worker registration failed:', error);
    });
})();
