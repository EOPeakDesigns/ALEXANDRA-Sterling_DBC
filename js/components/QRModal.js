/**
 * QR Modal Component
 * 
 * Handles QR code modal functionality including opening/closing,
 * download functionality, and accessibility features.
 */

class QRModal {
  constructor(element) {
    this.modal = element;
    this.backdrop = this.modal.querySelector('.modal-backdrop');
    this.closeButton = this.modal.querySelector('.modal-close');
    this.downloadButton = this.modal.querySelector('.download-btn');
    this.qrImage = this.modal.querySelector('.qr-code-image');
    this.triggerElement = null;
    
    // Download state management
    this.isDownloading = false;
    this.isShowingSuccess = false;
    this.downloadTimeout = null;
    this.originalButtonContent = null;
    
    this.initialize();
  }

  /**
   * Initialize the QR modal component
   */
  initialize() {
    this.setupEventListeners();
    this.setupKeyboardNavigation();
    this.setupDownloadFunctionality();
  }

  /**
   * Setup event listeners for modal interactions
   */
  setupEventListeners() {
    // Close modal when clicking backdrop
    this.backdrop.addEventListener('click', () => {
      this.close();
    });

    // Close modal when clicking close button
    this.closeButton.addEventListener('click', () => {
      this.close();
    });

    // Prevent modal content clicks from closing modal
    this.modal.querySelector('.modal-content').addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Setup keyboard navigation for accessibility
   */
  setupKeyboardNavigation() {
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Trap focus within modal when open
    this.modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && this.isOpen()) {
        this.trapFocus(e);
      }
    });
  }

  /**
   * Setup QR code download functionality
   */
  setupDownloadFunctionality() {
    // Store original button content for restoration
    this.originalButtonContent = this.downloadButton.innerHTML;
    
    // Enhanced click handler with debouncing and state management
    this.downloadButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleDownloadClick();
    });
    
    // Prevent context menu on long press for mobile
    this.downloadButton.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Open the modal
   * @param {HTMLElement} [trigger] - Element that opened the modal (for focus restore)
   */
  open(trigger) {
    this.triggerElement = trigger || document.activeElement;
    this.modal.classList.add('show');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.closeButton.focus();
  }

  /**
   * Close the modal
   */
  close() {
    this.modal.classList.remove('show');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    const trigger = this.triggerElement;
    this.triggerElement = null;

    if (trigger && typeof trigger.focus === 'function') {
      requestAnimationFrame(() => trigger.focus());
    }
  }

  /**
   * Check if modal is currently open
   * @returns {boolean} True if modal is open
   */
  isOpen() {
    return this.modal.classList.contains('show');
  }

  /**
   * Trap focus within modal for accessibility
   * @param {KeyboardEvent} e - Keyboard event
   */
  trapFocus(e) {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Handle download button click with state management
   */
  handleDownloadClick() {
    // Prevent multiple concurrent downloads or clicks during success feedback
    if (this.isDownloading || this.isShowingSuccess) {
      return;
    }
    
    // Clear any existing timeout
    if (this.downloadTimeout) {
      clearTimeout(this.downloadTimeout);
      this.downloadTimeout = null;
    }
    
    // Start download process
    this.downloadQRCode();
  }

  /**
   * Download QR code image with enhanced error handling and state management
   */
  async downloadQRCode() {
    // Set downloading state
    this.isDownloading = true;
    this.setButtonState('downloading');
    
    try {
      // Validate QR image source
      if (!this.qrImage || !this.qrImage.src) {
        throw new Error('QR code image not available');
      }
      
      // Show loading state
      this.updateButtonContent('downloading', 'Downloading...');
      
      // Fetch the QR code image with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(this.qrImage.src, {
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      // Check response status
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Validate content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('Invalid image format received');
      }
      
      const blob = await response.blob();
      
      // Validate blob size (prevent empty or corrupted files)
      if (blob.size === 0) {
        throw new Error('Empty image file received');
      }
      
      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `business-qr-code-${timestamp}.png`;
      
      // Create download link with enhanced error handling
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      try {
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Append and trigger download
        document.body.appendChild(link);
        link.click();
        
        // Small delay to ensure download starts
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Success feedback
        this.showDownloadSuccess();
        
      } finally {
        // Always cleanup
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      this.handleDownloadError(error);
    } finally {
      // Always reset downloading state
      this.isDownloading = false;
    }
  }

  /**
   * Set button state with proper accessibility
   * @param {string} state - Button state: 'normal', 'downloading', 'success', 'disabled'
   */
  setButtonState(state) {
    switch (state) {
      case 'downloading':
        this.downloadButton.disabled = true;
        this.downloadButton.setAttribute('aria-busy', 'true');
        this.downloadButton.setAttribute('aria-label', 'Downloading QR code, please wait');
        break;
      case 'success':
        this.downloadButton.disabled = true;
        this.downloadButton.setAttribute('aria-busy', 'false');
        this.downloadButton.setAttribute('aria-label', 'Download completed, please wait');
        break;
      case 'disabled':
        this.downloadButton.disabled = true;
        this.downloadButton.setAttribute('aria-busy', 'false');
        break;
      case 'normal':
      default:
        this.downloadButton.disabled = false;
        this.downloadButton.setAttribute('aria-busy', 'false');
        this.downloadButton.setAttribute('aria-label', 'Download QR code');
        break;
    }
  }

  /**
   * Update button content with loading spinner or feedback
   * @param {string} type - Content type: 'downloading', 'success', 'error'
   * @param {string} text - Text to display
   */
  updateButtonContent(type, text) {
    let icon = '';
    
    switch (type) {
      case 'downloading':
        icon = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M12 2v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;
        break;
      case 'success':
        icon = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        `;
        break;
      case 'error':
        icon = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        `;
        break;
      default:
        icon = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        `;
    }
    
    this.downloadButton.innerHTML = `${icon}${text}`;
  }

  /**
   * Show download success feedback with 1-second auto-restore
   */
  showDownloadSuccess() {
    // Set success state to prevent new downloads
    this.isShowingSuccess = true;
    
    // Update button content and state
    this.updateButtonContent('success', 'Downloaded!');
    this.setButtonState('success');
    
    // Announce success to screen readers
    this.announceToScreenReader('QR code downloaded successfully');
    
    // Auto-restore after exactly 1 second
    this.downloadTimeout = setTimeout(() => {
      this.restoreButton();
    }, 1000);
  }

  /**
   * Handle download errors with specific error messages
   * @param {Error} error - The error that occurred
   */
  handleDownloadError(error) {
    this.setButtonState('normal');
    
    let errorMessage = 'Download Failed';
    let detailedMessage = 'Please try again';
    
    // Classify error types for better user feedback
    if (error.name === 'AbortError') {
      errorMessage = 'Download Timeout';
      detailedMessage = 'Please check your connection';
    } else if (error.message.includes('HTTP')) {
      errorMessage = 'Network Error';
      detailedMessage = 'Please check your internet connection';
    } else if (error.message.includes('image format')) {
      errorMessage = 'Invalid File';
      detailedMessage = 'QR code format error';
    } else if (error.message.includes('not available')) {
      errorMessage = 'QR Code Unavailable';
      detailedMessage = 'Please refresh and try again';
    }
    
    this.updateButtonContent('error', errorMessage);
    
    // Announce error to screen readers
    this.announceToScreenReader(`Download failed: ${detailedMessage}`);
    
    // Auto-restore after longer delay for errors
    this.downloadTimeout = setTimeout(() => {
      this.restoreButton();
    }, 4000);
  }

  /**
   * Restore button to original state
   */
  restoreButton() {
    // Reset success state
    this.isShowingSuccess = false;
    
    // Restore original button content
    if (this.originalButtonContent) {
      this.downloadButton.innerHTML = this.originalButtonContent;
    }
    
    // Set button to normal state
    this.setButtonState('normal');
    
    // Clear timeout reference
    if (this.downloadTimeout) {
      clearTimeout(this.downloadTimeout);
      this.downloadTimeout = null;
    }
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  announceToScreenReader(message) {
    // Create or update aria-live region for screen reader announcements
    let liveRegion = document.getElementById('qr-download-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'qr-download-announcements';
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
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }

  /**
   * Destroy the component and clean up resources
   */
  destroy() {
    // Clean up download state and timeouts
    if (this.downloadTimeout) {
      clearTimeout(this.downloadTimeout);
      this.downloadTimeout = null;
    }
    
    // Reset button state
    this.isDownloading = false;
    this.isShowingSuccess = false;
    this.restoreButton();
    
    // QR button focus cleanup before modal removal
    const hubButton = document.querySelector('.action-flower__hub');
    if (hubButton) {
      hubButton.blur();
    }
    
    // Remove aria-live region if it exists
    const liveRegion = document.getElementById('qr-download-announcements');
    if (liveRegion) {
      document.body.removeChild(liveRegion);
    }
    
    // Remove event listeners and clean up
    document.body.style.overflow = '';
    this.modal.classList.remove('show');
    this.modal.setAttribute('aria-hidden', 'true');
    
    // Remove focus from any currently focused element
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    
    // Final hub focus cleanup
    setTimeout(() => {
      if (hubButton) {
        hubButton.blur();
      }
    }, 100);
  }
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QRModal };
}
