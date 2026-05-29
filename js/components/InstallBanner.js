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
  fallbackTimer: null,
  promptWaitTimer: null,
  engagementBound: false,
  initialized: false,
  defaultInstallLabel: 'Install',
  defaultInstallText: 'One-tap access anytime.',
  defaultGuideIOS: 'Tap Share, then Add to Home Screen.',
  defaultGuideAndroid: 'Tap the menu (⋮), then Install app.',

  applyLabels(labels = {}) {
    if (labels.installTitle) {
      const title = document.getElementById('install-banner-title');
      if (title) {
        title.textContent = labels.installTitle;
      }
    }

    if (labels.installText) {
      this.defaultInstallText = labels.installText;
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

    if (labels.installGuideIOS) {
      this.defaultGuideIOS = labels.installGuideIOS;
    }

    if (labels.installGuideAndroid) {
      this.defaultGuideAndroid = labels.installGuideAndroid;
    }
  },

  init() {
    if (this.initialized || window.location.protocol === 'file:') {
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
    window.addEventListener('dbc-pwa-prompt-ready', () => this.onPromptReadySignal());
    window.addEventListener('dbc-pwa-sw-ready', () => this.onPromptReadySignal());
    window.addEventListener('dbc-pwa-sw-controlling', () => this.onPromptReadySignal());

    this.hide();

    if (this.isStandalone()) {
      return;
    }

    if (window.__dbcDeferredPrompt) {
      this.capturePrompt(window.__dbcDeferredPrompt);
    } else if (this.isIOS()) {
      this.fallbackTimer = window.setTimeout(() => {
        if (!this.dismissedThisView && !this.isStandalone()) {
          this.show();
        }
      }, 1200);
    } else {
      this.bindEngagementRecheck();
      this.waitForLatePrompt();
    }

    this.installBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      this.promptInstall();
    });

    this.dismissBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.dismissedThisView = true;
      this.hide();
    });

    this.closeBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.dismissedThisView = true;
      this.hide();
    });

    this.updateInstallButtonState();
  },

  bindEngagementRecheck() {
    if (this.engagementBound) {
      return;
    }

    this.engagementBound = true;

    const recheck = () => {
      if (window.__dbcDeferredPrompt) {
        this.capturePrompt(window.__dbcDeferredPrompt);
      }
    };

    ['pointerdown', 'touchstart', 'scroll'].forEach((eventName) => {
      window.addEventListener(eventName, recheck, { once: true, passive: true });
    });
  },

  onPromptReadySignal() {
    if (window.__dbcDeferredPrompt) {
      this.capturePrompt(window.__dbcDeferredPrompt);
    }
  },

  waitForLatePrompt() {
    if (this.promptWaitTimer || this.getDeferredPrompt()) {
      return;
    }

    let attempts = 0;

    this.promptWaitTimer = window.setInterval(() => {
      attempts += 1;

      if (this.getDeferredPrompt()) {
        this.capturePrompt(this.getDeferredPrompt());
        window.clearInterval(this.promptWaitTimer);
        this.promptWaitTimer = null;
        return;
      }

      if (attempts >= 30) {
        window.clearInterval(this.promptWaitTimer);
        this.promptWaitTimer = null;
      }
    }, 500);
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

    if (this.promptWaitTimer) {
      window.clearInterval(this.promptWaitTimer);
      this.promptWaitTimer = null;
    }

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

  updateInstallButtonState() {
    if (!this.installBtn) {
      return;
    }

    const ready = Boolean(this.getDeferredPrompt());

    this.installBtn.classList.toggle('is-ready', ready);
    this.installBtn.disabled = false;
    this.installBtn.textContent = this.defaultInstallLabel;
    this.installBtn.setAttribute('aria-label', ready
      ? `${this.defaultInstallLabel} — ready`
      : this.defaultInstallLabel);

    const textEl = document.querySelector('.install-banner__text');
    if (textEl) {
      textEl.textContent = ready
        ? 'Tap Install to add this card to your device.'
        : this.defaultInstallText;
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

    if (!prompt || typeof prompt.prompt !== 'function') {
      this.handleInstallWithoutPrompt();
      return;
    }

    this.hideGuide();

    try {
      prompt.prompt();
    } catch (error) {
      console.warn('PWA install prompt failed:', error);
      this.handleInstallWithoutPrompt();
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

  handleInstallWithoutPrompt() {
    if (window.__dbcDeferredPrompt) {
      this.capturePrompt(window.__dbcDeferredPrompt);
      this.promptInstall();
      return;
    }

    this.show();
    this.showGuide(this.defaultGuideAndroid);
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

    this.showGuide(this.defaultGuideIOS);
  },

  openInChrome() {
    const pageUrl = window.location.href.split('#')[0];
    const path = `${window.location.pathname}${window.location.search}`;

    window.location.href = `intent://${window.location.host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(pageUrl)};end`;
  }
};

function bootPwaInstall() {
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
