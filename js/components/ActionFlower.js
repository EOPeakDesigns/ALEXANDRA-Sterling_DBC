/**
 * Action Flower Component
 *
 * Expandable hub on the avatar that blooms into three icon-only petals:
 * QR code, Save contact, and Share.
 */

class ActionFlower {
  constructor(element, callbacks = {}) {
    this.root = element;
    this.hub = element.querySelector('.action-flower__hub');
    this.petals = element.querySelectorAll('.action-flower__petal');
    this.avatarContainer = element.closest('.avatar-container');
    this.isOpen = false;
    this.onQR = callbacks.onQR || (() => {});
    this.onSave = callbacks.onSave || (() => {});
    this.onShare = callbacks.onShare || (() => {});

    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);

    this.initialize();
  }

  initialize() {
    this.hub.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggle();
      requestAnimationFrame(() => this.hub.blur());
    });

    const qrPetal = this.root.querySelector('.action-flower__petal--qr');
    const savePetal = this.root.querySelector('.action-flower__petal--save');
    const sharePetal = this.root.querySelector('.action-flower__petal--share');

    qrPetal?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.close();
      this.onQR(qrPetal);
      requestAnimationFrame(() => qrPetal.blur());
    });

    savePetal?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.onSave(savePetal);
      requestAnimationFrame(() => savePetal.blur());
      window.setTimeout(() => this.close(), 900);
    });

    sharePetal?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.onShare(sharePetal);
      requestAnimationFrame(() => sharePetal.blur());
      window.setTimeout(() => this.close(), 900);
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.root.classList.add('is-open');
    this.avatarContainer?.classList.add('action-flower-open');
    this.hub.setAttribute('aria-expanded', 'true');
    this.hub.setAttribute('aria-label', 'Close card actions');

    this.petals.forEach((petal) => {
      petal.removeAttribute('tabindex');
    });

    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleDocumentKeydown);
  }

  close() {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.root.classList.remove('is-open');
    this.avatarContainer?.classList.remove('action-flower-open');
    this.hub.setAttribute('aria-expanded', 'false');
    this.hub.setAttribute('aria-label', 'Open card actions');

    this.petals.forEach((petal) => {
      petal.setAttribute('tabindex', '-1');
    });

    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleDocumentKeydown);

    this.hub.blur();
  }

  handleDocumentClick(event) {
    if (!this.root.contains(event.target)) {
      this.close();
    }
  }

  handleDocumentKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  showPetalSuccess(petal) {
    if (!petal) {
      return;
    }

    petal.classList.add('success');
    setTimeout(() => petal.classList.remove('success'), 1200);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ActionFlower };
}
