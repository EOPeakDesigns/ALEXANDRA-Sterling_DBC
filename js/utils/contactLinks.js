/**
 * Contact link utilities — new-tab navigation keeps the card tab in place
 */

/**
 * Detect mobile/tablet user agents
 * @returns {boolean}
 */
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
}

/**
 * Detect iOS
 * @returns {boolean}
 */
function isIOSDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

/**
 * Detect Android
 * @returns {boolean}
 */
function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent || '');
}

/**
 * Open a URL in a new browser tab — never navigates the card tab
 * @param {string} url - Destination URL
 */
function openInNewTab(url) {
  if (!url) {
    return;
  }

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * @deprecated Use openInNewTab — kept for backward compatibility
 * @param {string} url - Destination URL
 */
function openExternalUrl(url) {
  openInNewTab(url);
}

/**
 * Open Google Maps web in a new tab only — never navigates the card tab
 * @param {string} webUrl - Google Maps web URL
 */
function openGoogleMapsWeb(webUrl) {
  openInNewTab(webUrl);
}

/**
 * Schedule Google Maps web fallback only if the app handoff did not occur
 * @param {string} webUrl - Google Maps web URL
 * @param {number} delayMs - Delay before fallback
 */
function scheduleMapsWebFallback(webUrl, delayMs = 700) {
  let fallbackTimer = null;

  const cancelFallback = () => {
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  document.addEventListener('visibilitychange', cancelFallback, { once: true });
  window.addEventListener('pagehide', cancelFallback, { once: true });

  fallbackTimer = window.setTimeout(() => {
    if (document.visibilityState === 'visible') {
      openGoogleMapsWeb(webUrl);
    }
  }, delayMs);
}

/**
 * Open maps for an address — Google Maps app first, browser tab fallback
 * @param {string} address - Location text
 */
function openMapsForAddress(address) {
  const query = encodeURIComponent(address.trim());
  const mapsWebUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  if (isAndroidDevice()) {
    const intentLink = document.createElement('a');
    intentLink.href = `intent://www.google.com/maps/search/?api=1&query=${query}#Intent;scheme=https;package=com.google.android.apps.maps;end`;
    document.body.appendChild(intentLink);
    intentLink.click();
    document.body.removeChild(intentLink);
    scheduleMapsWebFallback(mapsWebUrl);
    return;
  }

  if (isIOSDevice()) {
    const mapsLink = document.createElement('a');
    mapsLink.href = `comgooglemaps://?q=${query}`;
    document.body.appendChild(mapsLink);
    mapsLink.click();
    document.body.removeChild(mapsLink);
    scheduleMapsWebFallback(mapsWebUrl);
    return;
  }

  openGoogleMapsWeb(mapsWebUrl);
}

/**
 * Open Gmail compose in a new tab — card tab stays on the card
 * @param {string} email - Recipient email address
 */
function openGmailCompose(email) {
  const recipient = email.trim();
  const encoded = encodeURIComponent(recipient);
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encoded}`;

  openInNewTab(gmailWebUrl);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isMobileDevice,
    isIOSDevice,
    isAndroidDevice,
    openInNewTab,
    openExternalUrl,
    openMapsForAddress,
    openGmailCompose
  };
}
