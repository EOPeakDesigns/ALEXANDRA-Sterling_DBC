/* ============================================================
   PWA INSTALL BANNER
   ============================================================ */

const PWAInstall = {
  deferredPrompt: null,
  banner: null,
  installBtn: null,
  dismissBtn: null,
  closeBtn: null,
  installedKey: 'dbc-pwa-installed-v2',
  dismissedThisView: false,
  fallbackTimer: null,
  initialized: false,
  boundOnPromptReady: null,
  boundOnAppInstalled: null,

  applyLabels(labels = {}) {
    if (labels.installTitle) {
      const title = document.getElementById('install-banner-title');
      if (title) {
        title.textContent = labels.installTitle;
      }
    }

    if (labels.installText) {
      const text = document.querySelector('.install-banner__text');
      if (text) {
        text.textContent = labels.installText;
      }
    }

    if (labels.installApp) {
      const installButton = document.getElementById('pwa-install-btn');
      if (installButton) {
        installButton.textContent = labels.installApp;
      }
    }

    if (labels.installDismiss) {
      const dismissButton = document.getElementById('pwa-install-dismiss');
      if (dismissButton) {
        dismissButton.textContent = labels.installDismiss;
      }
    }
  },

  init() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.banner = document.getElementById('pwa-install-banner');
    this.installBtn = document.getElementById('pwa-install-btn');
    this.dismissBtn = document.getElementById('pwa-install-dismiss');
    this.closeBtn = document.querySelector('.install-banner__close');

    if (!this.banner) {
      return;
    }

    this.boundOnPromptReady = (event) => this.onBeforeInstallPrompt(event);
    this.boundOnAppInstalled = () => this.onAppInstalled();

    window.addEventListener('beforeinstallprompt', this.boundOnPromptReady);
    window.addEventListener('appinstalled', this.boundOnAppInstalled);
    window.addEventListener('dbc-pwa-prompt-ready', () => {
      if (window.__dbcDeferredPrompt) {
        this.onBeforeInstallPrompt(window.__dbcDeferredPrompt);
      }
    });

    this.hide();

    if (this.isStandalone()) {
      localStorage.setItem(this.installedKey, '1');
      return;
    }

    if (localStorage.getItem(this.installedKey)) {
      this.hide();
    }

    this.fallbackTimer = window.setTimeout(() => {
      if (!this.deferredPrompt && !this.dismissedThisView && !this.isKnownInstalled()) {
        this.show();
      }
    }, 1200);

    if (window.__dbcDeferredPrompt) {
      this.onBeforeInstallPrompt(window.__dbcDeferredPrompt);
    }

    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => this.promptInstall());
    }

    if (this.dismissBtn) {
      this.dismissBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.dismissedThisView = true;
        this.hide();
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.dismissedThisView = true;
        this.hide();
      });
    }
  },

  onBeforeInstallPrompt(event) {
    const prompt = (event && typeof event.prompt === 'function')
      ? event
      : window.__dbcDeferredPrompt;

    if (!prompt || typeof prompt.prompt !== 'function') {
      return;
    }

    if (typeof event?.preventDefault === 'function') {
      event.preventDefault();
    }

    this.deferredPrompt = prompt;
    window.__dbcDeferredPrompt = prompt;

    if (this.fallbackTimer) {
      window.clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    localStorage.removeItem(this.installedKey);

    if (!this.dismissedThisView) {
      this.show();
    }
  },

  onAppInstalled() {
    localStorage.setItem(this.installedKey, '1');
    this.deferredPrompt = null;
    window.__dbcDeferredPrompt = null;
    this.hide();
  },

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator.standalone === true;
  },

  isKnownInstalled() {
    return this.isStandalone() || localStorage.getItem(this.installedKey);
  },

  show() {
    if (!this.banner || this.dismissedThisView || this.isKnownInstalled()) {
      return;
    }

    this.banner.hidden = false;
    this.banner.removeAttribute('hidden');
    this.banner.classList.add('install-banner--visible');
    this.banner.setAttribute('aria-hidden', 'false');
  },

  hide() {
    if (!this.banner) {
      return;
    }

    this.banner.hidden = true;
    this.banner.setAttribute('hidden', '');
    this.banner.classList.remove('install-banner--visible');
    this.banner.setAttribute('aria-hidden', 'true');
  },

  getDeferredPrompt() {
    return this.deferredPrompt || window.__dbcDeferredPrompt || null;
  },

  async promptInstall() {
    const prompt = this.getDeferredPrompt();

    if (!prompt || typeof prompt.prompt !== 'function') {
      this.showManualInstallHelp();
      return;
    }

    try {
      prompt.prompt();
      const choice = await prompt.userChoice;

      if (!choice || choice.outcome !== 'accepted') {
        this.dismissedThisView = true;
      }
    } catch (error) {
      console.warn('PWA install prompt failed:', error);
      this.showManualInstallHelp();
      return;
    }

    this.deferredPrompt = null;
    window.__dbcDeferredPrompt = null;
    this.hide();
  },

  showManualInstallHelp() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    if (isIOS) {
      window.alert('To add this card: tap Share, then Add to Home Screen.');
      return;
    }

    if (this.isInAppBrowser()) {
      this.openInChrome();
      return;
    }

    window.alert('Use your browser menu and choose Install app or Add to Home screen.');
  },

  isInAppBrowser() {
    const ua = navigator.userAgent || '';

    return (
      /FBAN|FBAV|Instagram|Line\/|Twitter|WhatsApp|Snapchat|TikTok|LinkedInApp/i.test(ua) ||
      (/Android/i.test(ua) && /\bwv\b/.test(ua))
    );
  },

  openInChrome() {
    const pageUrl = window.location.href.split('#')[0];
    const path = `${window.location.pathname}${window.location.search}`;

    window.location.href = `intent://${window.location.host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(pageUrl)};end`;
  }
};

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
    return;
  }

  if (registerServiceWorker.started) {
    return;
  }

  registerServiceWorker.started = true;

  const register = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register, { once: true });
  } else {
    register();
  }
}

function bootPwaInstall() {
  if (window.location.protocol === 'file:') {
    return;
  }

  PWAInstall.init();
  registerServiceWorker();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootPwaInstall, { once: true });
} else {
  bootPwaInstall();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PWAInstall, registerServiceWorker };
}
