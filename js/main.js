/**
 * Main Application Entry Point
 *
 * Initializes all components and utilities for the business card application.
 */

const AppConfig = {
  animation: {
    duration: 600,
    easing: 'ease-out'
  },
  accessibility: {
    enableKeyboardNavigation: true,
    respectReducedMotion: true
  },
  components: {
    contactRows: true,
    socialBar: true,
    qrModal: true,
    showcaseVideo: true
  }
};

class BusinessCardApp {
  constructor(config = AppConfig) {
    this.config = config;
    this.components = new Map();
    this.cardData = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      console.warn('BusinessCardApp already initialized');
      return;
    }

    try {
      await this.waitForDOM();
      await this.loadCardData();
      this.applyCardData();
      this.updateSeoMeta();
      this.initializeComponents();
      this.initializeUtilities();
      this.initializeInstallBanner();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize BusinessCardApp:', error);
    }
  }

  applyCardData() {
    if (!this.cardData) {
      return;
    }

    const { owner, media, social, labels } = this.cardData;

    if (owner?.slogan) {
      const slogan = document.querySelector('.social-slogan');
      if (slogan) {
        slogan.textContent = owner.slogan;
      }
    }

    if (media?.avatar) {
      const avatar = document.querySelector('#avatar');
      if (avatar) {
        avatar.src = media.avatar;
        avatar.alt = `Profile photo of ${owner?.fullName || 'owner'}`;
      }
    }

    if (media?.qrCode) {
      const qrImage = document.querySelector('.qr-code-image');
      if (qrImage) {
        qrImage.src = media.qrCode;
      }
    }

    if (Array.isArray(social) && social.length) {
      const socialLinks = document.querySelectorAll('.social-icons a[aria-label*="profile"]');
      socialLinks.forEach((link, index) => {
        const entry = social[index];
        if (!entry?.url) {
          return;
        }
        link.href = entry.url;
        link.setAttribute('aria-label', entry.label || link.getAttribute('aria-label') || 'Social profile');
        link.setAttribute('title', entry.label || link.getAttribute('title') || 'Visit profile');
        link.rel = 'noopener noreferrer';
      });
    }

    if (labels?.skipToContent) {
      const skipLink = document.querySelector('.skip-link');
      if (skipLink) {
        skipLink.textContent = labels.skipToContent;
      }
    }

    if (labels?.installTitle) {
      const installTitle = document.querySelector('#install-banner-title');
      if (installTitle) {
        installTitle.textContent = labels.installTitle;
      }
    }

    if (labels?.installText) {
      const installText = document.querySelector('.install-banner__text');
      if (installText) {
        installText.textContent = labels.installText;
      }
    }

    if (labels?.installApp) {
      const installAction = document.getElementById('pwa-install-btn');
      if (installAction) {
        installAction.textContent = labels.installApp;
      }
    }

    if (labels?.installDismiss) {
      const installDismiss = document.getElementById('pwa-install-dismiss');
      if (installDismiss) {
        installDismiss.textContent = labels.installDismiss;
      }
    }
  }

  updateSeoMeta() {
    const pageUrl = window.location.href.split('#')[0];
    const origin = window.location.origin;
    const owner = this.cardData?.owner;
    const title = owner
      ? `${owner.fullName} - ${owner.role}`
      : document.title;
    const description = owner?.bio || document.querySelector('meta[name="description"]')?.content;
    const imagePath = this.cardData?.media?.avatar || 'assets/images/Owner.webp';
    const imageUrl = imagePath.startsWith('http') ? imagePath : `${origin}/${imagePath.replace(/^\//, '')}`;

    document.title = title;

    setMetaContent('description', description);
    setMetaContent('og:title', title, 'property');
    setMetaContent('og:description', description, 'property');
    setMetaContent('og:url', pageUrl, 'property');
    setMetaContent('og:image', imageUrl, 'property');
    setMetaContent('og:type', 'website', 'property');
    setMetaContent('og:site_name', owner?.fullName || 'Digital Business Card', 'property');
    setMetaContent('twitter:card', 'summary_large_image');
    setMetaContent('twitter:title', title);
    setMetaContent('twitter:description', description);
    setMetaContent('twitter:url', pageUrl);
    setMetaContent('twitter:image', imageUrl);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;
  }

  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  async loadCardData() {
    if (window.location.protocol === 'file:') {
      return;
    }

    try {
      const response = await fetch('data/card.json');
      if (response.ok) {
        this.cardData = await response.json();
      }
    } catch (error) {
      console.warn('Could not load card.json:', error);
    }
  }

  initializeComponents() {
    if (this.config.components.contactRows) {
      this.initializeContactRows();
    }

    if (this.config.components.socialBar) {
      this.initializeSocialBar();
    }

    if (this.config.components.qrModal) {
      this.initializeActionFlower();
    }

    if (this.config.components.showcaseVideo) {
      this.initializeShowcaseVideo();
    }
  }

  initializeContactRows() {
    document.querySelectorAll('.contact-row').forEach((row, index) => {
      try {
        this.components.set(`contactRow-${index}`, new ContactRow(row));
      } catch (error) {
        console.error(`Failed to initialize contact row ${index}:`, error);
      }
    });
  }

  initializeSocialBar() {
    const socialBarElement = document.querySelector('.social-bar');
    if (!socialBarElement) {
      return;
    }

    try {
      this.components.set('socialBar', new SocialBar(socialBarElement));
    } catch (error) {
      console.error('Failed to initialize social bar:', error);
    }
  }

  initializeActionFlower() {
    const flowerElement = document.querySelector('#action-flower');
    const modalElement = document.querySelector('#qr-modal');

    if (!flowerElement) {
      return;
    }

    let qrModal = null;

    if (modalElement) {
      try {
        qrModal = new QRModal(modalElement);
        this.components.set('qrModal', qrModal);
      } catch (error) {
        console.error('Failed to initialize QR modal:', error);
      }
    }

    try {
      const flower = new ActionFlower(flowerElement, {
        onQR: (petal) => {
          if (qrModal) {
            qrModal.open(petal);
          }
        },
        onSave: (petal) => this.handleSaveContact(petal),
        onShare: (petal) => this.handleShareCard(petal)
      });

      this.components.set('actionFlower', flower);
    } catch (error) {
      console.error('Failed to initialize action flower:', error);
    }
  }

  initializeShowcaseVideo() {
    const modalElement = document.querySelector('#video-modal');
    const playButton = document.querySelector('#showcase-play-btn');

    if (!modalElement || !playButton) {
      return;
    }

    try {
      const videoModal = new VideoModal(modalElement, playButton);
      const videoConfig = this.cardData?.media?.showcaseVideo || {
        src: '',
        embedUrl: 'https://www.youtube.com/embed/2Ri8f-wqonE?playsinline=1&rel=0&modestbranding=1',
        poster: 'assets/images/Owner.webp'
      };
      const labels = this.cardData?.labels || {
        showcaseEyebrow: 'Studio Moment',
        showcaseTitle: 'Design in Motion',
        showcaseCaption: 'Colour, form, and the journey from thought to masterpiece.',
        showcasePlay: 'Play studio moment',
        showcaseClose: 'Close video'
      };

      videoModal.configure(videoConfig, labels);
      this.components.set('videoModal', videoModal);
    } catch (error) {
      console.error('Failed to initialize showcase video:', error);
    }
  }

  handleSaveContact(button) {
    const data = this.getCardDataFromDom();
    downloadVCard(data);
    this.announceUtilityFeedback(button, data.labels?.saveSuccess || 'Contact saved');
    this.getComponent('actionFlower')?.showPetalSuccess(button);
  }

  async handleShareCard(button) {
    const data = this.getCardDataFromDom();
    const result = await shareCard(data);
    const labels = data.labels || {};

    if (result === 'shared') {
      this.announceUtilityFeedback(button, labels.shareSuccess || 'Link shared');
      this.getComponent('actionFlower')?.showPetalSuccess(button);
    } else if (result === 'copied') {
      this.announceUtilityFeedback(button, labels.shareCopied || 'Link copied to clipboard');
      this.getComponent('actionFlower')?.showPetalSuccess(button);
    }
  }

  getCardDataFromDom() {
    if (this.cardData) {
      return this.cardData;
    }

    const phoneText = document.querySelector('.whatsapp-row .contact-text')?.textContent?.trim() || '';
    return {
      owner: {
        firstName: document.querySelector('.first-name')?.textContent?.trim() || '',
        lastName: document.querySelector('.last-name')?.textContent?.trim() || '',
        fullName: `${document.querySelector('.first-name')?.textContent?.trim() || ''} ${document.querySelector('.last-name')?.textContent?.trim() || ''}`.trim(),
        role: document.querySelector('.role')?.textContent?.trim() || '',
        bio: document.querySelector('meta[name="description"]')?.content || '',
        slogan: document.querySelector('.social-slogan')?.textContent?.trim() || ''
      },
      contact: {
        phone: phoneText,
        phoneRaw: phoneText.replace(/[^\d+]/g, ''),
        email: document.querySelector('.gmail-row .contact-text')?.textContent?.trim() || '',
        website: document.querySelector('.website-row .contact-text')?.textContent?.trim() || '',
        websiteUrl: normalizeWebsiteUrl(document.querySelector('.website-row .contact-text')?.textContent?.trim() || ''),
        address: document.querySelector('.contact-row[aria-label*="Get directions"] .contact-text')?.textContent?.trim() || ''
      },
      labels: {
        saveSuccess: 'Contact saved',
        shareSuccess: 'Link shared',
        shareCopied: 'Link copied to clipboard'
      }
    };
  }

  announceUtilityFeedback(button, message) {
    button.classList.add('success');
    announceToScreenReader(message);

    setTimeout(() => {
      button.classList.remove('success');
    }, 1500);
  }

  initializeInstallBanner() {
    if (window.location.protocol === 'file:') {
      return;
    }

    PWAInstall.applyLabels(this.cardData?.labels || {
      installTitle: 'Install Card',
      installText: 'One-tap access anytime.',
      installApp: 'Install',
      installDismiss: 'Not now'
    });
  }

  initializeUtilities() {
    if (this.config.accessibility.enableKeyboardNavigation) {
      initializeKeyboardNavigation();
    }

    if (this.config.accessibility.respectReducedMotion) {
      handleReducedMotion();
    }

    initializeManifest();
  }

  getComponent(name) {
    return this.components.get(name) || null;
  }

  destroy() {
    this.components.clear();
    this.initialized = false;
  }
}

let app;

function setMetaContent(name, content, attr = 'name') {
  if (!content) {
    return;
  }

  let meta = document.querySelector(`meta[${attr}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function normalizeWebsiteUrl(website) {
  if (!website) {
    return '';
  }
  return website.startsWith('http') ? website : `https://${website}`;
}

function initializeManifest() {
  if (window.location.protocol === 'file:') {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.remove();
    }
  }
}

function initializeApp() {
  if (!app) {
    app = new BusinessCardApp();
    app.initialize();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BusinessCardApp, AppConfig };
}
