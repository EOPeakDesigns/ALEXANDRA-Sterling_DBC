/**
 * PWA Install Banner — native install on Android, Share sheet on iOS
 */

const INSTALL_INSTALLED_KEY = 'dbc-install-installed-v5';
const SHOW_ATTEMPT_DELAYS_MS = [400, 1200, 2500, 5000, 8000];

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
    this.isPreparingInstall = false;
    this.showTimers = [];
    this.labels = {};
    this.defaultInstallLabel = 'Install';

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
      this.defaultInstallLabel = labels.installApp;
      this.installButton.textContent = labels.installApp;
    }

    if (labels.installDismiss && this.dismissButton) {
      this.dismissButton.textContent = labels.installDismiss;
    }
  }

  initialize() {
    if (this.isStandalone()) {
      this.markInstalled();
      return;
    }

    this.clearStaleInstalledFlag();

    window.addEventListener('dbcinstallpromptready', this.handlePromptReady);
    window.addEventListener('beforeinstallprompt', this.handlePromptReady);
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

  handlePromptReady(event) {
    const prompt = this.resolvePromptFromEvent(event);

    if (prompt) {
      this.setDeferredPrompt(prompt);
    }
  }

  resolvePromptFromEvent(event) {
    if (event && typeof event.prompt === 'function') {
      return event;
    }

    if (event?.detail && typeof event.detail.prompt === 'function') {
      return event.detail;
    }

    return window.__dbcInstallPromptEvent || null;
  }

  handleServiceWorkerReady() {
    this.attemptShow();
    this.updateInstallButtonState();
  }

  setDeferredPrompt(event) {
    this.deferredPrompt = event;
    window.__dbcInstallPromptEvent = event;
    this.promptReceived = true;
    this.isPreparingInstall = false;
    this.hideGuide();
    this.updateInstallButtonState();
    this.attemptShow();

    if (this.guideEl && this.isAndroidDevice() && !this.isInAppBrowser()) {
      this.guideEl.textContent = 'Install is ready — tap Install again.';
      this.guideEl.hidden = false;
      window.setTimeout(() => this.hideGuide(), 2800);
    }
  }

  handleAppInstalled() {
    this.clearPrompt();
    this.markInstalled();
    this.hide(false);
  }

  getAvailablePrompt() {
    const prompt = this.deferredPrompt || window.__dbcInstallPromptEvent;

    if (prompt && typeof prompt.prompt === 'function') {
      return prompt;
    }

    return null;
  }

  handleInstallClick() {
    if (this.isIOSDevice()) {
      this.triggerIOSInstall();
      return;
    }

    const prompt = this.getAvailablePrompt();

    if (prompt) {
      this.runNativeInstallPrompt(prompt);
      return;
    }

    if (this.isInAppBrowser()) {
      this.openInSystemBrowser();
      return;
    }

    if (this.isAndroidDevice()) {
      this.beginAndroidInstallReadiness();
      return;
    }

    this.runNativeInstallPrompt(null);
  }

  /**
   * prompt() must be invoked synchronously during the user click.
   */
  runNativeInstallPrompt(prompt) {
    if (!prompt) {
      this.beginAndroidInstallReadiness();
      return;
    }

    this.hideGuide();
    this.setInstallButtonPreparing(false);

    try {
      prompt.prompt();
    } catch (error) {
      console.warn('Install prompt failed:', error);
      this.beginAndroidInstallReadiness();
      return;
    }

    prompt.userChoice
      .then((choice) => {
        if (choice.outcome === 'accepted') {
          this.markInstalled();
          this.hide(false);
        }
      })
      .catch((error) => {
        console.warn('Install choice failed:', error);
      })
      .finally(() => {
        this.clearPrompt();
        this.updateInstallButtonState();
      });
  }

  beginAndroidInstallReadiness() {
    if (this.isPreparingInstall) {
      return;
    }

    this.isPreparingInstall = true;
    this.setInstallButtonPreparing(true);

    if (this.guideEl) {
      this.guideEl.textContent = 'Starting install…';
      this.guideEl.hidden = false;
    }

    const readinessChecks = [500, 1500, 3000, 5000];

    readinessChecks.forEach((delay, index) => {
      window.setTimeout(() => {
        if (this.getAvailablePrompt()) {
          this.isPreparingInstall = false;
          this.setInstallButtonPreparing(false);
          this.updateInstallButtonState();

          if (this.guideEl) {
            this.guideEl.textContent = 'Install is ready — tap Install again.';
            this.guideEl.hidden = false;
          }

          return;
        }

        if (index === readinessChecks.length - 1) {
          this.isPreparingInstall = false;
          this.setInstallButtonPreparing(false);
          this.updateInstallButtonState();

          if (this.guideEl) {
            this.guideEl.textContent = 'Install is almost ready — tap Install once more.';
            this.guideEl.hidden = false;
          }
        }
      }, delay);
    });
  }

  async triggerIOSInstall() {
    const shareData = {
      title: document.title || 'Digital Business Card',
      text: this.textEl?.textContent || 'Save this card to your home screen.',
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

    if (this.guideEl) {
      this.guideEl.textContent = this.labels.installGuideIOS || 'Tap Share, then Add to Home Screen.';
      this.guideEl.hidden = false;
      this.banner.classList.add('install-banner--guide-open');
    }
  }

  openInSystemBrowser() {
    const pageUrl = window.location.href.split('#')[0];
    const path = `${window.location.pathname}${window.location.search}`;

    if (this.guideEl) {
      this.guideEl.textContent = 'Opening in Chrome for install…';
      this.guideEl.hidden = false;
    }

    window.location.href = `intent://${window.location.host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(pageUrl)};end`;
  }

  isInAppBrowser() {
    const ua = navigator.userAgent || '';

    return (
      /FBAN|FBAV|Instagram|Line\/|Twitter|WhatsApp|Snapchat|TikTok|LinkedInApp/i.test(ua) ||
      (/Android/i.test(ua) && /\bwv\b/.test(ua)) ||
      (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua))
    );
  }

  setInstallButtonPreparing(isPreparing) {
    if (!this.installButton) {
      return;
    }

    this.installButton.classList.toggle('is-preparing', isPreparing);
    this.installButton.disabled = isPreparing;
    this.installButton.setAttribute('aria-busy', isPreparing ? 'true' : 'false');
    this.installButton.textContent = isPreparing
      ? 'Starting…'
      : this.defaultInstallLabel;
  }

  hideGuide() {
    if (!this.guideEl) {
      return;
    }

    this.guideEl.hidden = true;
    this.guideEl.textContent = '';
    this.banner.classList.remove('install-banner--guide-open');
  }

  clearPrompt() {
    this.deferredPrompt = null;
    this.promptReceived = false;
    window.__dbcInstallPromptEvent = null;
  }

  updateInstallButtonState() {
    if (!this.installButton || this.isPreparingInstall) {
      return;
    }

    const canNativeInstall = Boolean(this.getAvailablePrompt());

    this.installButton.hidden = false;
    this.installButton.removeAttribute('hidden');
    this.installButton.disabled = false;
    this.installButton.classList.toggle('is-ready', canNativeInstall);
    this.installButton.textContent = this.defaultInstallLabel;
    this.installButton.setAttribute('aria-busy', 'false');
    this.installButton.setAttribute('aria-label', canNativeInstall
      ? `${this.defaultInstallLabel} — ready`
      : this.defaultInstallLabel);
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
    window.removeEventListener('beforeinstallprompt', this.handlePromptReady);
    window.removeEventListener('dbcserviceworkerready', this.handleServiceWorkerReady);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
    document.removeEventListener('keydown', this.handleKeydown);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InstallBanner, INSTALL_INSTALLED_KEY };
}
