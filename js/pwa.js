/**
 * PWA bootstrap — runs in <head> before the page paints.
 * Registers the service worker and captures the install prompt early.
 */
(function () {
  'use strict';

  window.__dbcDeferredPrompt = null;

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

  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function (error) {
    console.warn('Service worker registration failed:', error);
  });

  var reloaded = false;

  try {
    reloaded = sessionStorage.getItem('dbc-sw-active') === '1';
  } catch (error) {
    reloaded = false;
  }

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!navigator.serviceWorker.controller || reloaded) {
      return;
    }

    try {
      sessionStorage.setItem('dbc-sw-active', '1');
    } catch (error) {
      return;
    }

    window.location.reload();
  });
})();
