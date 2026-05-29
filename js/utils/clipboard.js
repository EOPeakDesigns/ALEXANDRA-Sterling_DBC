/**
 * Enhanced Clipboard Utilities
 * 
 * Handles copy-to-clipboard functionality with modern Clipboard API,
 * fallback support for older browsers, and creative success animations.
 * Includes accessibility considerations and error handling.
 */

/**
 * Enhanced copy-to-clipboard with modern API and creative animations
 * @param {string} text - Text to copy to clipboard
 * @param {Event} event - Click event from the copy button
 */
async function copyToClipboard(text, event) {
  // Prevent the parent click event
  event.stopPropagation();
  
  const button = event.currentTarget;
  
  // Disable button during copy operation
  button.disabled = true;
  
  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      await showSuccessAnimation(button);
    } else {
      // Fallback to execCommand for older browsers
      await fallbackCopyToClipboard(text);
      await showSuccessAnimation(button);
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    await showErrorFeedback(button);
  } finally {
    // Re-enable button after operation
    button.disabled = false;
  }
}

/**
 * Fallback copy method for older browsers
 * @param {string} text - Text to copy to clipboard
 */
async function fallbackCopyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    
    try {
      textarea.select();
      textarea.setSelectionRange(0, 99999); // For mobile devices
      const successful = document.execCommand('copy');
      
      if (successful) {
        resolve();
      } else {
        reject(new Error('execCommand copy failed'));
      }
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

/**
 * Show creative success animation with checkmark
 * @param {HTMLElement} button - Copy button element
 */
async function showSuccessAnimation(button) {
  // Add success class for styling and animation
  button.classList.add('success');
  
  // Announce success to screen readers only
  announceToScreenReader('Text copied to clipboard');
  
  // Wait for animation to complete (1 second)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Remove success state
  button.classList.remove('success');
}

/**
 * Show error feedback for failed copy operations
 * @param {HTMLElement} button - Copy button element
 */
async function showErrorFeedback(button) {
  // Add error class for styling
  button.classList.add('error');
  
  // Announce error to screen readers only
  announceToScreenReader('Failed to copy text');
  
  // Wait for error display
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Remove error state
  button.classList.remove('error');
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
  // Create or use existing live region
  let liveRegion = document.getElementById('copy-announcements');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'copy-announcements';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }
  
  liveRegion.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { copyToClipboard };
}
