/**
 * Accessibility Utilities
 * 
 * Handles keyboard navigation, reduced motion preferences,
 * and other accessibility features.
 */

/**
 * Initializes keyboard navigation for contact rows
 * Adds Enter and Space key support for clickable elements
 */
function initializeKeyboardNavigation() {
  document.querySelectorAll('.contact-row').forEach(row => {
    row.addEventListener('keydown', (e) => {
      // Trigger click on Enter or Space
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    });
  });
}

/**
 * Handles reduced motion preferences
 * Disables animations for users who prefer reduced motion
 */
function handleReducedMotion() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    const businessCard = document.querySelector('.business-card');
    if (businessCard) {
      businessCard.style.animation = 'none';
      businessCard.style.transform = 'translateY(0)';
      businessCard.style.opacity = '1';
    }
  }
}

/**
 * Initializes all accessibility features
 * Call this function when the DOM is ready
 */
function initializeAccessibility() {
  initializeKeyboardNavigation();
  handleReducedMotion();
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    initializeAccessibility, 
    initializeKeyboardNavigation, 
    handleReducedMotion 
  };
}
