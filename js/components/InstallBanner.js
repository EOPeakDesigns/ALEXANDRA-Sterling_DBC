/**
 * PWA Install Banner - compact mobile prompt, bottom-right
 */

const INSTALL_INSTALLED_KEY = 'dbc-install-installed-v4';
const SHOW_ATTEMPT_DELAYS_MS = [800, 2200, 4500];

const INSTALL_GUIDES = {
  ios: 'Tap Share, then Add to Home Screen.',
  android: 'Tap menu, then Install app.',
  desktop: 'Use your browser menu to install this app.'
};

window.__dbcInstallPromptEvent = window.__dbcInstallPromptEvent || null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  window.__dbcInstallPromptEvent = event;
  window.dispatchEvent(new CustomEvent('dbcinstallpromptready'));
});

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
    this.labels = {};

    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleBeforeInstallPrompt = this.handleBeforeInstallPrompt.bind(this);
    this.handleAppInstalled = this.handleAppInstalled.bind(this);
    this.handlePromptReady = this.handlePromptReady.bind(this);

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
      INSTALL_GUIDES.ios = labels.installGuideIOS;
    }

    if (labels.installGuideAndroid) {
      INSTALL_GUIDES.android = labels.installGuideAndroid;
    }
  }

  initialize() {
    if (this.isStandalone()) {
      this.markInstalled();
      return;
    }

    if (this.wasInstalledFromThisBrowser()) {
      return;
    }

    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.addEventListener('dbcinstallpromptready', this.handlePromptReady);
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

    this.installButton?.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await this.handleInstallClick();
    });

    this.ensureMobileActionsVisible();
    this.scheduleShowAttempts();

    if (document.readyState === 'complete') {
      this.attemptShow();
    } else {
      window.addEventListener('load', () => this.attemptShow(), { once: true });
    }
  }

  handleBeforeInstallPrompt(event) {
    event.preventDefault();
    window.__dbcInstallPromptEvent = event;
    this.setDeferredPrompt(event);
  }

  handlePromptReady() {
    if (window.__dbcInstallPromptEvent) {
      this.setDeferredPrompt(window.__dbcInstallPromptEvent);
    }
  }

  setDeferredPrompt(event) {
    this.deferredPrompt = event;
    this.promptReceived = true;
    this.hideGuide();
    this.ensureMobileActionsVisible();
    this.attemptShow();
  }

  handleAppInstalled() {
    this.deferredPrompt = null;
    this.markInstalled();
    this.hide(false);
  }

  async handleInstallClick() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        this.markInstalled();
      }

      this.deferredPrompt = null;
      window.__dbcInstallPromptEvent = null;
      this.hide(false);
      return;
    }

    this.showPlatformGuide();
  }

  showPlatformGuide() {
    if (!this.guideEl) {
      return;
    }

    let message = INSTALL_GUIDES.desktop;

    if (this.isIOSDevice()) {
      message = INSTALL_GUIDES.ios;
    } else if (this.isAndroidDevice()) {
      message = INSTALL_GUIDES.android;
    }

    this.guideEl.textContent = message;
    this.guideEl.hidden = false;
    this.banner.classList.add('install-banner--guide-open');
  }

  hideGuide() {
    if (!this.guideEl) {
      return;
    }

    this.guideEl.hidden = true;
    this.guideEl.textContent = '';
    this.banner.classList.remove('install-banner--guide-open');
  }

  ensureMobileActionsVisible() {
    if (!this.isMobileContext()) {
      return;
    }

    if (this.installButton) {
      this.installButton.hidden = false;
      this.installButton.removeAttribute('hidden');
    }

    if (this.dismissButton) {
      this.dismissButton.hidden = false;
      this.dismissButton.removeAttribute('hidden');
    }
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
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator.standalone === true
    );
  }

  wasInstalledFromThisBrowser() {
    return this.getStorageValue(INSTALL_INSTALLED_KEY) === '1';
  }

  markInstalled() {
    this.setStorageValue(INSTALL_INSTALLED_KEY, '1');
  }

  shouldShow() {
    if (this.isStandalone() || this.wasInstalledFromThisBrowser() || this.closedForCurrentPage) {
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

    this.ensureMobileActionsVisible();
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
      // Storage can be unavailable in private modes; install state still works via display-mode.
    }
  }

  destroy() {
    this.clearShowTimers();
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.removeEventListener('dbcinstallpromptready', this.handlePromptReady);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
    document.removeEventListener('keydown', this.handleKeydown);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InstallBanner, INSTALL_INSTALLED_KEY };
}
