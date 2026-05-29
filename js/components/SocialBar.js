/**
 * Social Bar Component
 * 
 * Handles social media links and interactions.
 * Currently uses placeholder links but can be easily extended.
 */

class SocialBar {
  constructor(element) {
    this.element = element;
    this.socialLinks = this.getSocialLinks();
    this.initialize();
  }

  /**
   * Get social media link configurations
   * @returns {Array} Array of social link configurations
   */
  getSocialLinks() {
    return [
      {
        platform: 'instagram',
        url: 'https://instagram.com/alexsterling_design',
        ariaLabel: 'Instagram profile'
      },
      {
        platform: 'facebook',
        url: 'https://facebook.com/alexsterling.creative',
        ariaLabel: 'Facebook profile'
      },
      {
        platform: 'pinterest',
        url: 'https://pinterest.com/alexsterling_design',
        ariaLabel: 'Pinterest profile'
      },
      {
        platform: 'x',
        url: 'https://x.com/alexsterling_design',
        ariaLabel: 'X profile'
      },
      {
        platform: 'behance',
        url: 'https://behance.net/alexsterling',
        ariaLabel: 'Behance profile'
      },
      {
        platform: 'upwork',
        url: 'https://upwork.com/freelancers/~alexsterling',
        ariaLabel: 'Upwork profile'
      }
    ];
  }

  /**
   * Initialize the social bar component
   */
  initialize() {
    this.updateSocialLinks();
    this.setupClickHandlers();
  }

  /**
   * Update social media links with actual URLs
   */
  updateSocialLinks() {
    const socialIcons = this.element.querySelectorAll('.social-icon');
    
    socialIcons.forEach((icon, index) => {
      const link = icon.closest('a');
      if (link && this.socialLinks[index]) {
        link.href = this.socialLinks[index].url;
        link.setAttribute('aria-label', this.socialLinks[index].ariaLabel);
      }
    });
  }

  /**
   * Setup click handlers for social links with external navigation
   */
  setupClickHandlers() {
    const socialLinks = this.element.querySelectorAll('a[aria-label*="profile"]');
    
    socialLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Ensure external navigation with security
        if (link.href && link.href !== 'javascript:void(0)') {
          window.open(link.href, '_blank', 'noopener noreferrer');
        }
      });
    });
  }

  /**
   * Update social slogan text
   * @param {string} slogan - New creative slogan
   */
  updateSocialSlogan(slogan) {
    const sloganElement = this.element.querySelector('.social-slogan');
    if (sloganElement) {
      sloganElement.textContent = slogan;
    }
  }

  /**
   * Update social handle text (legacy method for backward compatibility)
   * @param {string} handle - New social media handle
   */
  updateSocialHandle(handle) {
    const handleElement = this.element.querySelector('.social-handle');
    const sloganElement = this.element.querySelector('.social-slogan');
    
    if (handleElement) {
      handleElement.textContent = handle;
    } else if (sloganElement) {
      sloganElement.textContent = handle;
    }
  }
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SocialBar };
}
