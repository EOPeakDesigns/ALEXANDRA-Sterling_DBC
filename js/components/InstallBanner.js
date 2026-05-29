/**
 * PWA Install Banner - compact mobile prompt, bottom-right
 */

const INSTALL_INSTALLED_KEY = 'dbc-install-installed-v5';
const SHOW_ATTEMPT_DELAYS_MS = [600, 1800, 3500, 6000];

const DEFAULT_INSTALL_GUIDES = {
  ios: 'Tap Share, then Add to Home Screen.',
  android: 'Tap menu, then Install app.',
  other: 'Use your browser menu to add this card to your home screen.'
};

class InstallBanner {
  constructor(element) {
    this.banner = element;
    this.closeButton = element.querySelector('.install-banner__close');
    this.dismissButton = element.querySelector('.install-banner__dismiss');
    this.installButton = element.querySelector('.install-banner__action');
    this.guideEl = element.querySelector('#install-banner-guide');
    this.titleEl = element.querySelector('#install-banner-title');
    this.textEl = element.querySelector('.install-banner__text');
    this.deferredPrompt = null;
    this.promptReceived = false;
    this.isVisible = false;
    this.closedForCurrentPage = false;
    this.showTimers = [];
    this.guides = { ...DEFAULT_INSTALL_GUIDES };
    this.labels = {};

    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleAppInstalled = this.handleAppInstalled.bind(this);
    this.handlePromptReady = this.handlePromptReady.bind(this);
    this.handleServiceWorkerReady = this.handleServiceWorkerReady.bind(this);

    this.initialize();
  }

  setLabels(labels = {}) {
    this.labels = labels;

    if (labels.installTitle && this.titleEl) {
      this.titleEl.textContent = labels.installTitle;
    }

    if (labels.installText && this.textEl) {
      this.textEl.textContent = labels.installText;
    }

    if (labels.installApp && this.installButton) {
      this.installButton.textContent = labels.installApp;
    }

    if (labels.installDismiss && this.dismissButton) {
      this.dismissButton.textContent = labels.installDismiss;
    }

    if (labels.installGuideIOS) {
      this.guides.ios = labels.installGuideIOS;
    }

    if (labels.installGuideAndroid) {
      this.guides.android = labels.installGuideAndroid;
    }

    if (labels.installGuideOther) {
      this.guides.other = labels.installGuideOther;
    }
  }

  initialize() {
    if (this.isStandalone()) {
      this.markInstalled();
      return;
    }

    this.clearStaleInstalledFlag();

    window.addEventListener('dbcinstallpromptready', this.handlePromptReady);
    window.addEventListener('dbcserviceworkerready', this.handleServiceWorkerReady);
    window.addEventListener('appinstalled', this.handleAppInstalled);

    if (window.__dbcInstallPromptEvent) {
      this.setDeferredPrompt(window.__dbcInstallPromptEvent);
    }

    this.closeButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.closeForNow();
    });

    this.dismissButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.closeForNow();
    });

    this.installButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.handleInstallClick();
    });

    this.updateInstallButtonState();
    this.scheduleShowAttempts();
    this.attemptShow();

    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => this.attemptShow(), { once: true });
    }
  }

  clearStaleInstalledFlag() {
    if (this.getStorageValue(INSTALL_INSTALLED_KEY) === '1') {
      try {
        localStorage.removeItem(INSTALL_INSTALLED_KEY);
      } catch (error) {
        // Ignore storage errors in private browsing.
      }
    }
  }

  handlePromptReady() {
    if (window.__dbcInstallPromptEvent) {
      this.setDeferredPrompt(window.__dbcInstallPromptEvent);
    }
  }

  handleServiceWorkerReady() {
    this.attemptShow();
  }

  setDeferredPrompt(event) {
    this.deferredPrompt = event;
    this.promptReceived = true;
    this.hideGuide();
    this.updateInstallButtonState();
    this.attemptShow();
  }

  handleAppInstalled() {
    this.clearPrompt();
    this.markInstalled();
    this.hide(false);
  }

  getAvailablePrompt() {
    return this.deferredPrompt || window.__dbcInstallPromptEvent || null;
  }

  /**
   * Must call prompt() synchronously inside the click handler
   * or Android Chrome will block the native install dialog.
   */
  handleInstallClick() {
    const prompt = this.getAvailablePrompt();

    if (prompt && typeof prompt.prompt === 'function') {
      this.hideGuide();

      prompt.prompt()
        .then(() => prompt.userChoice)
        .then((choice) => {
          if (choice.outcome === 'accepted') {
            this.markInstalled();
            this.hide(false);
          } else {
            this.showInstallGuide(this.getFallbackGuideKey());
          }
        })
        .catch((error) => {
          console.warn('Install prompt failed:', error);
          this.showInstallGuide(this.getFallbackGuideKey());
        })
        .finally(() => {
          this.clearPrompt();
          this.updateInstallButtonState();
        });

      return;
    }

    this.showInstallGuide(this.getFallbackGuideKey());
  }

  getFallbackGuideKey() {
    if (this.isIOSDevice()) {
      return 'ios';
    }

    if (this.isAndroidDevice()) {
      return 'android';
    }

    return 'other';
  }

  showInstallGuide(platformKey) {
    if (!this.guideEl) {
      return;
    }

    const message = this.guides[platformKey] || this.guides.other;
    this.guideEl.textContent = message;
    this.guideEl.hidden = false;
    this.banner.classList.add('install-banner--guide-open');

    if (this.installButton) {
      this.installButton.classList.add('is-guide-active');
      window.setTimeout(() => {
        this.installButton?.classList.remove('is-guide-active');
      }, 420);
    }
  }

  hideGuide() {
    if (!this.guideEl) {
      return;
    }

    this.guideEl.hidden = true;
    this.guideEl.textContent = '';
    this.banner.classList.remove('install-banner--guide-open');
    this.installButton?.classList.remove('is-guide-active');
  }

  clearPrompt() {
    this.deferredPrompt = null;
    this.promptReceived = false;
    window.__dbcInstallPromptEvent = null;
  }

  updateInstallButtonState() {
    if (!this.installButton) {
      return;
    }

    const canNativeInstall = Boolean(this.getAvailablePrompt());

    this.installButton.hidden = false;
    this.installButton.removeAttribute('hidden');
    this.installButton.classList.toggle('is-ready', canNativeInstall);
    this.installButton.setAttribute('aria-label', canNativeInstall
      ? `${this.installButton.textContent || 'Install'} — ready`
      : (this.installButton.textContent || 'Install'));
  }

  scheduleShowAttempts() {
    SHOW_ATTEMPT_DELAYS_MS.forEach((delay) => {
      const timer = window.setTimeout(() => this.attemptShow(), delay);
      this.showTimers.push(timer);
    });
  }

  clearShowTimers() {
    this.showTimers.forEach((timer) => window.clearTimeout(timer));
    this.showTimers = [];
  }

  isIOSDevice() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  }

  isAndroidDevice() {
    return /Android/i.test(navigator.userAgent || '');
  }

  isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  }

  isMobileContext() {
    return (
      this.isMobileDevice() ||
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true
    );
  }

  markInstalled() {
    this.setStorageValue(INSTALL_INSTALLED_KEY, '1');
  }

  shouldShow() {
    if (this.isStandalone() || this.closedForCurrentPage) {
      return false;
    }

    if (this.isMobileContext()) {
      return true;
    }

    return this.promptReceived;
  }

  attemptShow() {
    if (!this.shouldShow()) {
      return;
    }

    this.updateInstallButtonState();
    this.show();
  }

  show() {
    if (this.isVisible || !this.shouldShow()) {
      return;
    }

    this.isVisible = true;
    this.banner.hidden = false;
    this.banner.removeAttribute('hidden');
    this.banner.classList.add('install-banner--visible');
    this.banner.setAttribute('aria-hidden', 'false');
    document.addEventListener('keydown', this.handleKeydown);
  }

  hide(persistDismiss) {
    this.isVisible = false;
    this.banner.hidden = true;
    this.banner.setAttribute('hidden', '');
    this.banner.classList.remove('install-banner--visible', 'install-banner--guide-open');
    this.banner.setAttribute('aria-hidden', 'true');
    this.hideGuide();
    document.removeEventListener('keydown', this.handleKeydown);

    if (persistDismiss) {
      this.closedForCurrentPage = true;
      this.clearShowTimers();
    }
  }

  closeForNow() {
    this.hide(true);
    this.closeButton?.blur();
  }

  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.closeForNow();
    }
  }

  getStorageValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  setStorageValue(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Storage can be unavailable in private modes.
    }
  }

  destroy() {
    this.clearShowTimers();
    window.removeEventListener('dbcinstallpromptready', this.handlePromptReady);
    window.removeEventListener('dbcserviceworkerready', this.handleServiceWorkerReady);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
    document.removeEventListener('keydown', this.handleKeydown);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InstallBanner, INSTALL_INSTALLED_KEY };
}
