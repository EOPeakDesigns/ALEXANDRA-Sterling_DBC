/**
 * Contact Row Component
 *
 * Handles individual contact row functionality including
 * click actions, copy functionality, and accessibility.
 */

class ContactRow {
  constructor(element) {
    this.element = element;
    this.initialize();
  }

  initialize() {
    this.setupClickHandlers();
    this.setupCopyButtons();
    this.setupCallButton();
  }

  setupCallButton() {
    const callButton = this.element.querySelector('.call-btn');
    const phoneText = this.element.querySelector('.contact-text')?.textContent?.trim();

    if (!callButton || !phoneText) {
      return;
    }

    const cleanPhone = phoneText.replace(/[^\d+]/g, '');
    callButton.href = `tel:${cleanPhone}`;

    callButton.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    callButton.addEventListener('pointerup', (event) => {
      event.stopPropagation();
      resetCallButtonVisual(callButton);
    });
  }

  setupClickHandlers() {
    if (this.element.classList.contains('whatsapp-row')) {
      this.element.addEventListener('click', (event) => {
        if (event.target.closest('.copy-btn') || event.target.closest('.call-btn')) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const phoneText = this.element.querySelector('.contact-text')?.textContent?.trim();
        if (!phoneText) {
          return;
        }

        const cleanPhone = phoneText.replace(/[^\d+]/g, '').replace(/^\+/, '');
        openInNewTab(`https://wa.me/${cleanPhone}`);
      });
    }

    if (this.element.classList.contains('gmail-row')) {
      this.element.addEventListener('click', (event) => {
        if (event.target.closest('.copy-btn')) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const emailText = this.element.querySelector('.contact-text')?.textContent?.trim();
        if (!emailText) {
          return;
        }

        openGmailCompose(emailText);
      });
    }

    if (this.element.classList.contains('website-row')) {
      this.element.addEventListener('click', (event) => {
        if (event.target.closest('.copy-btn')) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const websiteText = this.element.querySelector('.contact-text')?.textContent?.trim();
        if (!websiteText) {
          return;
        }

        const websiteUrl = websiteText.startsWith('http') ? websiteText : `https://${websiteText}`;
        openInNewTab(websiteUrl);
      });
    }

    if (this.element.classList.contains('location-row')) {
      this.element.addEventListener('click', (event) => {
        if (event.target.closest('.copy-btn')) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const addressText = this.element.querySelector('.contact-text')?.textContent?.trim();
        if (!addressText) {
          return;
        }

        openMapsForAddress(addressText);
      });
    }
  }

  setupCopyButtons() {
    const copyButtons = this.element.querySelectorAll('.copy-btn');
    copyButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const contactText = this.element.querySelector('.contact-text')?.textContent;
        copyToClipboard(contactText, event);
      });
    });
  }
}

/**
 * Clear sticky hover/focus/active styles after call button is pressed
 * @param {HTMLElement} button - Call button element
 */
function resetCallButtonVisual(button) {
  button.classList.add('is-cooldown');
  button.blur();

  const releaseCooldown = () => {
    button.classList.remove('is-cooldown');
  };

  button.addEventListener('pointerleave', releaseCooldown, { once: true });
  window.setTimeout(releaseCooldown, 350);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ContactRow };
}
