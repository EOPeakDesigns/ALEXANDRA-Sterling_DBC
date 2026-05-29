/**
 * PWA Install Banner — bottom-right floating prompt
 *
 * Shows on smartphones when the card is not yet installed.
 * Hidden in standalone mode or after the user dismisses it.
 */

const INSTALL_DISMISS_KEY = 'dbc-install-dismiss-v3';
const INSTALL_INSTALLED_KEY = 'dbc-install-installed-v3';
const SHOW_ATTEMPT_DELAYS_MS = [800, 2200, 4500];

class InstallBanner {
  constructor(element) {
    this.banner = element;
    this.closeButton = element.querySelector('.install-banner__close');
    this.dismissButton = element.querySelector('.install-banner__dismiss');
    this.installButton = element.querySelector('.install-banner__action');
    this.iosHint = element.querySelector('.install-banner__ios-hint');
    this.androidHint = element.querySelector('.install-banner__android-hint');
    this.deferredPrompt = null;
    this.promptReceived = false;
    this.isVisible = false;
    this.showTimers = [];

    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleBeforeInstallPrompt = this.handleBeforeInstallPrompt.bind(this);
    this.handleAppInstalled = this.handleAppInstalled.bind(this);

    this.initialize();
  }

  initialize() {
    if (this.isStandalone()) {
      this.markInstalled();
      return;
    }

    if (this.isDismissed()) {
      return;
    }

    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.handleAppInstalled);

    this.closeButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.dismiss();
    });

    this.dismissButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.dismiss();
    });

    this.installButton?.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await this.handleInstallClick();
    });

    this.scheduleShowAttempts();

    if (document.readyState === 'complete') {
      this.attemptShow();
    } else {
      window.addEventListener('load', () => this.attemptShow(), { once: true });
    }
  }

  handleBeforeInstallPrompt(event) {
    event.preventDefault();
    this.deferredPrompt = event;
    this.promptReceived = true;
    this.configureAndroidMode();
    this.attemptShow();
  }

  handleAppInstalled() {
    this.deferredPrompt = null;
    this.markInstalled();
    this.hide(false);
  }

  async handleInstallClick() {
    if (!this.deferredPrompt) {
      return;
    }

    this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      this.markInstalled();
    }

    this.deferredPrompt = null;
    this.hide(false);
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

  isDismissed() {
    return (
      localStorage.getItem(INSTALL_DISMISS_KEY) === '1' ||
      localStorage.getItem(INSTALL_INSTALLED_KEY) === '1'
    );
  }

  markInstalled() {
    localStorage.setItem(INSTALL_INSTALLED_KEY, '1');
  }

  shouldShow() {
    if (this.isStandalone() || this.isDismissed()) {
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

    if (!this.promptReceived) {
      this.configureFallbackMode();
    }

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
    this.banner.classList.remove('install-banner--visible');
    this.banner.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', this.handleKeydown);

    if (persistDismiss) {
      localStorage.setItem(INSTALL_DISMISS_KEY, '1');
      this.clearShowTimers();
    }
  }

  dismiss() {
    this.hide(true);
    this.closeButton?.blur();
  }

  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.dismiss();
    }
  }

  configureAndroidMode() {
    if (this.iosHint) {
      this.iosHint.hidden = true;
    }
    if (this.androidHint) {
      this.androidHint.hidden = false;
    }
    if (this.installButton) {
      this.installButton.hidden = false;
    }
  }

  configureIOSMode() {
    if (this.iosHint) {
      this.iosHint.hidden = false;
    }
    if (this.androidHint) {
      this.androidHint.hidden = true;
    }
    if (this.installButton) {
      this.installButton.hidden = true;
    }
  }

  configureFallbackMode() {
    if (this.isIOSDevice()) {
      this.configureIOSMode();
      return;
    }

    if (this.isAndroidDevice()) {
      if (this.iosHint) {
        this.iosHint.hidden = true;
      }
      if (this.androidHint) {
        this.androidHint.hidden = false;
      }
      if (this.installButton) {
        this.installButton.hidden = !this.promptReceived;
      }
      return;
    }

    if (this.iosHint) {
      this.iosHint.hidden = true;
    }
    if (this.androidHint) {
      this.androidHint.hidden = true;
    }
    if (this.installButton) {
      this.installButton.hidden = !this.promptReceived;
    }
  }

  destroy() {
    this.clearShowTimers();
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
    document.removeEventListener('keydown', this.handleKeydown);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InstallBanner, INSTALL_DISMISS_KEY, INSTALL_INSTALLED_KEY };
}
