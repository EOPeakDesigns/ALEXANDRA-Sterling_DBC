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
  dismissedThisView: false,
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
        this.textDefault = labels.installText;
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
    this.textDefault = document.querySelector('.install-banner__text')?.textContent || 'One-tap access anytime.';

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
    window.addEventListener('dbc-pwa-sw-ready', () => {
      if (window.__dbcDeferredPrompt) {
        this.capturePrompt(window.__dbcDeferredPrompt);
      }
    });

    this.hide();

    if (this.isStandalone()) {
      return;
    }

    if (window.__dbcDeferredPrompt) {
      this.capturePrompt(window.__dbcDeferredPrompt);
    } else if (this.isIOS()) {
      window.setTimeout(() => {
        if (!this.dismissedThisView && !this.isStandalone()) {
          this.show();
        }
      }, 1200);
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

    this.updateInstallButtonState();
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
    this.hideGuide();
    this.updateInstallButtonState();

    if (!this.dismissedThisView && !this.isStandalone()) {
      this.show();
    }
  },

  onAppInstalled() {
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

  isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  },

  isInAppBrowser() {
    const ua = navigator.userAgent || '';

    return (
      /FBAN|FBAV|Instagram|Line\/|Twitter|WhatsApp|Snapchat|TikTok|LinkedInApp/i.test(ua) ||
      (/Android/i.test(ua) && /\bwv\b/.test(ua))
    );
  },

  show() {
    if (!this.banner || this.dismissedThisView || this.isStandalone()) {
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

    this.installBtn.hidden = false;
    this.installBtn.removeAttribute('hidden');
    this.installBtn.classList.toggle('is-ready', ready);
    this.installBtn.disabled = !ready && !this.isIOS();
    this.installBtn.textContent = this.defaultInstallLabel;
    this.installBtn.setAttribute('aria-label', ready
      ? `${this.defaultInstallLabel} — ready`
      : this.defaultInstallLabel);

    const textEl = document.querySelector('.install-banner__text');
    if (textEl) {
      textEl.textContent = ready
        ? 'Tap Install to add this card to your device.'
        : this.textDefault;
    }
  },

  promptInstall() {
    if (this.isIOS()) {
      this.promptInstallIOS();
      return;
    }

    if (this.isInAppBrowser()) {
      this.openInChrome();
      return;
    }

    const prompt = this.getDeferredPrompt();

    if (!prompt) {
      return;
    }

    this.hideGuide();

    try {
      prompt.prompt();
    } catch (error) {
      console.warn('PWA install prompt failed:', error);
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

  showGuide(message) {
    if (!this.guideEl || !message) {
      return;
    }

    this.guideEl.textContent = message;
    this.guideEl.hidden = false;
    this.banner?.classList.add('install-banner--guide-open');
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
