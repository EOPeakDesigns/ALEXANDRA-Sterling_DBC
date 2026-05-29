/* ============================================================
   PWA INSTALL BANNER
   ============================================================ */

const PWAInstall = {
  deferredPrompt: null,
  banner: null,
  installBtn: null,
  dismissBtn: null,
  closeBtn: null,
  guideEl: null,
  installedKey: 'dbc-pwa-installed-v2',
  dismissedThisView: false,
  fallbackTimer: null,
  promptWatchTimer: null,
  initialized: false,
  defaultInstallLabel: 'Install',

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
      this.defaultInstallLabel = labels.installApp;
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
    this.guideEl = document.getElementById('install-banner-guide');

    if (!this.banner) {
      return;
    }

    window.addEventListener('beforeinstallprompt', (event) => this.capturePrompt(event));
    window.addEventListener('appinstalled', () => this.onAppInstalled());
    window.addEventListener('dbc-pwa-prompt-ready', () => {
      if (window.__dbcDeferredPrompt) {
        this.capturePrompt(window.__dbcDeferredPrompt);
      }
    });
    window.addEventListener('dbc-pwa-sw-ready', () => this.updateInstallButtonState());

    this.hide();
    this.clearStaleInstalledFlag();

    if (this.isStandalone()) {
      localStorage.setItem(this.installedKey, '1');
      return;
    }

    if (window.__dbcDeferredPrompt) {
      this.capturePrompt(window.__dbcDeferredPrompt);
    }

    this.fallbackTimer = window.setTimeout(() => {
      if (!this.dismissedThisView && !this.isKnownInstalled()) {
        this.show();
        this.updateInstallButtonState();
      }
    }, 1200);

    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => this.promptInstall());
    }

    if (this.dismissBtn) {
      this.dismissBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.dismissedThisView = true;
        this.hideGuide();
        this.hide();
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.dismissedThisView = true;
        this.hideGuide();
        this.hide();
      });
    }

    this.updateInstallButtonState();
  },

  clearStaleInstalledFlag() {
    if (localStorage.getItem(this.installedKey) === '1' && !this.isStandalone()) {
      try {
        localStorage.removeItem(this.installedKey);
      } catch (error) {
        // Ignore storage errors.
      }
    }
  },

  capturePrompt(event) {
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
    this.stopPromptWatch();
    this.hideGuide();
    this.updateInstallButtonState();

    if (!this.dismissedThisView) {
      this.show();
    }
  },

  onAppInstalled() {
    localStorage.setItem(this.installedKey, '1');
    this.deferredPrompt = null;
    window.__dbcDeferredPrompt = null;
    this.stopPromptWatch();
    this.hide();
  },

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator.standalone === true;
  },

  isKnownInstalled() {
    return this.isStandalone();
  },

  isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  },

  isAndroid() {
    return /Android/i.test(navigator.userAgent || '');
  },

  isInAppBrowser() {
    const ua = navigator.userAgent || '';

    return (
      /FBAN|FBAV|Instagram|Line\/|Twitter|WhatsApp|Snapchat|TikTok|LinkedInApp/i.test(ua) ||
      (/Android/i.test(ua) && /\bwv\b/.test(ua))
    );
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
    this.banner.classList.remove('install-banner--visible', 'install-banner--guide-open');
    this.banner.setAttribute('aria-hidden', 'true');
    this.hideGuide();
  },

  hideGuide() {
    if (!this.guideEl) {
      return;
    }

    this.guideEl.hidden = true;
    this.guideEl.textContent = '';
    this.banner?.classList.remove('install-banner--guide-open');
  },

  showGuide(message) {
    if (!this.guideEl || !message) {
      return;
    }

    this.guideEl.textContent = message;
    this.guideEl.hidden = false;
    this.banner?.classList.add('install-banner--guide-open');
  },

  getDeferredPrompt() {
    return this.deferredPrompt || window.__dbcDeferredPrompt || null;
  },

  canNativeInstall() {
    return Boolean(this.getDeferredPrompt());
  },

  updateInstallButtonState() {
    if (!this.installBtn) {
      return;
    }

    const ready = this.canNativeInstall();
    const waiting = Boolean(this.promptWatchTimer);

    this.installBtn.classList.toggle('is-ready', ready);
    this.installBtn.classList.toggle('is-waiting', waiting && !ready);
    this.installBtn.disabled = waiting && !ready;

    if (waiting && !ready) {
      this.installBtn.textContent = 'Preparing…';
      return;
    }

    this.installBtn.textContent = this.defaultInstallLabel;
    this.installBtn.setAttribute('aria-label', ready
      ? `${this.defaultInstallLabel} — ready`
      : this.defaultInstallLabel);
  },

  promptInstall() {
    if (this.isIOS()) {
      this.promptInstallIOS();
      return;
    }

    if (this.isInAppBrowser()) {
      this.showGuide('Opening Chrome so you can install…');
      this.openInChrome();
      return;
    }

    const prompt = this.getDeferredPrompt();

    if (prompt) {
      this.runNativeInstallPrompt(prompt);
      return;
    }

    this.waitForNativePrompt();
  },

  runNativeInstallPrompt(prompt) {
    this.hideGuide();

    try {
      prompt.prompt();
    } catch (error) {
      console.warn('PWA install prompt failed:', error);
      this.waitForNativePrompt();
      return;
    }

    prompt.userChoice
      .then((choice) => {
        if (!choice || choice.outcome !== 'accepted') {
          this.dismissedThisView = true;
        }
      })
      .catch((error) => {
        console.warn('PWA install choice failed:', error);
      })
      .finally(() => {
        this.deferredPrompt = null;
        window.__dbcDeferredPrompt = null;
        this.updateInstallButtonState();
        this.hide();
      });
  },

  waitForNativePrompt() {
    if (this.promptWatchTimer) {
      return;
    }

    this.showGuide('Preparing install — one moment…');
    this.updateInstallButtonState();

    var attempts = 0;
    var maxAttempts = 24;

    this.promptWatchTimer = window.setInterval(() => {
      attempts += 1;
      const prompt = this.getDeferredPrompt();

      if (prompt) {
        this.stopPromptWatch();
        this.hideGuide();
        this.updateInstallButtonState();
        this.showGuide('Install is ready — tap Install again.');
        return;
      }

      if (attempts >= maxAttempts) {
        this.stopPromptWatch();
        this.updateInstallButtonState();
        this.showGuide('Install is almost ready — wait a few seconds, then tap Install again.');
      }
    }, 500);
  },

  stopPromptWatch() {
    if (this.promptWatchTimer) {
      window.clearInterval(this.promptWatchTimer);
      this.promptWatchTimer = null;
    }
  },

  async promptInstallIOS() {
    const shareData = {
      title: document.title || 'Alexandra Sterling',
      text: 'Save this card to your home screen.',
      url: window.location.href.split('#')[0]
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        this.hideGuide();
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
      }
    }

    this.showGuide('Tap Share, then Add to Home Screen.');
  },

  openInChrome() {
    const pageUrl = window.location.href.split('#')[0];
    const path = `${window.location.pathname}${window.location.search}`;

    window.location.href = `intent://${window.location.host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(pageUrl)};end`;
  }
};

function bootPwaInstall() {
  if (window.location.protocol === 'file:') {
    return;
  }

  PWAInstall.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootPwaInstall, { once: true });
} else {
  bootPwaInstall();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PWAInstall };
}
