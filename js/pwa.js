/**
 * PWA bootstrap — runs first in <head>.
 * Captures install prompt early and registers the service worker.
 */
(function () {
  'use strict';

  window.__dbcDeferredPrompt = null;
  window.__dbcPwaSwControlling = false;

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
  var reloadScheduled = false;

  if (hadControllerAtStart) {
    window.__dbcPwaSwControlling = true;
  }

  function markSwControlling() {
    if (!navigator.serviceWorker.controller) {
      return;
    }

    window.__dbcPwaSwControlling = true;
    window.dispatchEvent(new Event('dbc-pwa-sw-controlling'));
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

  function scheduleBootstrapReload() {
    if (
      reloadScheduled ||
      hadControllerAtStart ||
      window.__dbcDeferredPrompt ||
      !shouldBootstrapReload()
    ) {
      return;
    }

    reloadScheduled = true;

    window.setTimeout(function () {
      if (window.__dbcDeferredPrompt || navigator.serviceWorker.controller) {
        reloadScheduled = false;
        markSwControlling();
        return;
      }

      if (!shouldBootstrapReload()) {
        reloadScheduled = false;
        return;
      }

      try {
        sessionStorage.setItem('dbc-sw-boot', '1');
      } catch (error) {
        reloadScheduled = false;
        return;
      }

      window.location.reload();
    }, 4000);
  }

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    markSwControlling();

    if (window.__dbcDeferredPrompt) {
      window.dispatchEvent(new Event('dbc-pwa-prompt-ready'));
    }
  });

  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(function (registration) {
      if (!hadControllerAtStart && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      if (!hadControllerAtStart && registration.installing) {
        registration.installing.addEventListener('statechange', function () {
          if (registration.installing && registration.installing.state === 'activated') {
            scheduleBootstrapReload();
          }
        });
      }

      return navigator.serviceWorker.ready;
    })
    .then(function () {
      markSwControlling();
      window.dispatchEvent(new Event('dbc-pwa-sw-ready'));

      if (!hadControllerAtStart && !navigator.serviceWorker.controller) {
        scheduleBootstrapReload();
      }
    })
    .catch(function (error) {
      console.warn('Service worker registration failed:', error);
    });
})();
