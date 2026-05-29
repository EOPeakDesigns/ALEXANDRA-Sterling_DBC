/**
 * Owner Showcase Video Modal
 *
 * YouTube embed (lazy data-src) with legacy <video> fallback.
 * Stops and resets all media on close to prevent background audio.
 */

class VideoModal {
  constructor(modalElement, playButton) {
    this.modal = modalElement;
    this.playButton = playButton;
    this.backdrop = this.modal.querySelector('.modal-backdrop');
    this.closeButton = this.modal.querySelector('.video-modal__close');
    this.eyebrowEl = this.modal.querySelector('#video-modal-eyebrow');
    this.titleEl = this.modal.querySelector('#video-modal-title');
    this.captionEl = this.modal.querySelector('#video-modal-caption');
    this.videoEl = this.modal.querySelector('#video-modal-player');
    this.iframeEl = this.modal.querySelector('#profileVideoFrame');
    this.triggerElement = null;

    this.config = {
      src: '',
      embedUrl: '',
      poster: ''
    };

    this.labels = {};
    this.activeMode = null;

    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.setupKeyboardNavigation();
    this.setupPlayTrigger();
  }

  setupEventListeners() {
    this.backdrop.addEventListener('click', () => this.close());
    this.closeButton.addEventListener('click', () => this.close());

    this.modal.querySelector('.modal-content').addEventListener('click', (event) => {
      event.stopPropagation();
    });

    if (this.videoEl) {
      this.videoEl.addEventListener('error', () => {
        if (this.config.embedUrl && this.activeMode === 'video') {
          this.activateEmbed();
        }
      });
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    this.modal.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' && this.isOpen()) {
        this.trapFocus(event);
      }
    });
  }

  setupPlayTrigger() {
    if (!this.playButton) {
      return;
    }

    this.playButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(this.playButton);
      this.releasePlayButtonFocus(this.playButton);
    });
  }

  releasePlayButtonFocus(button) {
    button.classList.add('is-cooldown');
    button.blur();

    window.setTimeout(() => {
      button.classList.remove('is-cooldown');
    }, 320);
  }

  configure(videoConfig = {}, labels = {}) {
    this.config = {
      src: (videoConfig.src || '').trim(),
      embedUrl: normalizeEmbedUrl((videoConfig.embedUrl || '').trim()),
      poster: (videoConfig.poster || '').trim()
    };

    this.labels = labels;

    this.applyLabels();
    this.applyPoster();
    this.syncEmbedDataSrc();

    const hasMedia = Boolean(
      this.config.src ||
      this.config.embedUrl ||
      this.iframeEl?.getAttribute('data-src')
    );

    if (this.playButton) {
      this.playButton.hidden = !hasMedia;

      const playLabel = labels.showcasePlay || 'Play studio moment';
      this.playButton.setAttribute('aria-label', playLabel);
    }

    if (this.iframeEl && labels.showcaseTitle) {
      this.iframeEl.title = labels.showcaseTitle;
    }

    return hasMedia;
  }

  syncEmbedDataSrc() {
    if (!this.iframeEl || !this.config.embedUrl) {
      return;
    }

    this.iframeEl.setAttribute('data-src', this.config.embedUrl);
  }

  applyLabels() {
    const { showcaseEyebrow, showcaseTitle, showcaseCaption, showcaseClose } = this.labels;

    if (showcaseEyebrow && this.eyebrowEl) {
      this.eyebrowEl.textContent = showcaseEyebrow;
    }

    if (showcaseTitle && this.titleEl) {
      this.titleEl.textContent = showcaseTitle;
    }

    if (showcaseCaption && this.captionEl) {
      this.captionEl.textContent = showcaseCaption;
    }

    if (showcaseClose && this.closeButton) {
      this.closeButton.setAttribute('aria-label', showcaseClose);
    }
  }

  applyPoster() {
    if (!this.config.poster || !this.videoEl) {
      return;
    }

    this.videoEl.poster = this.config.poster;
  }

  open(trigger) {
    const embedUrl = this.config.embedUrl || this.iframeEl?.getAttribute('data-src');

    if (!this.config.src && !embedUrl) {
      return;
    }

    this.triggerElement = trigger || document.activeElement;
    this.modal.classList.add('show');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (embedUrl) {
      this.activateEmbed();
    } else {
      this.activateVideo(this.config.src);
    }

    this.closeButton.focus();
  }

  close() {
    this.stopMedia();

    this.modal.classList.remove('show');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    const trigger = this.triggerElement;
    this.triggerElement = null;

    if (trigger && typeof trigger.focus === 'function') {
      requestAnimationFrame(() => trigger.focus());
    }
  }

  loadEmbed() {
    if (!this.iframeEl) {
      return;
    }

    const url = this.iframeEl.getAttribute('data-src');

    if (url) {
      this.iframeEl.src = url;
    }
  }

  unloadEmbed() {
    if (!this.iframeEl) {
      return;
    }

    this.iframeEl.removeAttribute('src');
  }

  activateVideo(src) {
    if (!this.videoEl) {
      this.activateEmbed();
      return;
    }

    this.activeMode = 'video';
    this.unloadEmbed();

    this.videoEl.hidden = false;
    this.videoEl.src = src;
    this.videoEl.load();
  }

  activateEmbed() {
    this.activeMode = 'embed';
    this.clearVideo();
    this.loadEmbed();
  }

  clearVideo() {
    if (!this.videoEl) {
      return;
    }

    this.videoEl.pause();
    this.videoEl.removeAttribute('src');
    this.videoEl.load();
    this.videoEl.hidden = true;
  }

  stopMedia() {
    this.unloadEmbed();
    this.clearVideo();
    this.activeMode = null;
  }

  isOpen() {
    return this.modal.classList.contains('show');
  }

  trapFocus(event) {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const focusable = Array.from(focusableElements).filter(
      (element) => !element.hidden && element.offsetParent !== null
    );

    if (focusable.length === 0) {
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

function normalizeEmbedUrl(url) {
  if (!url) {
    return '';
  }

  try {
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return videoId
        ? `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`
        : url;
    }

    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
      return videoId
        ? `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`
        : url;
    }

    if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split(/[/?#]/)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
  } catch (error) {
    return url;
  }

  return url;
}
