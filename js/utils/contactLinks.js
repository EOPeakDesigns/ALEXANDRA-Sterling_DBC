/**
 * Contact link utilities — mobile-first maps, Gmail, and external navigation
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
 * Navigate to an external URL — same-tab on mobile to avoid popup blockers
 * @param {string} url - Destination URL
 */
function openExternalUrl(url) {
  if (!url) {
    return;
  }

  if (isMobileDevice()) {
    window.location.assign(url);
    return;
  }

  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newWindow) {
    window.location.assign(url);
  }
}

/**
 * Open Google Maps web in a new tab only — never navigates the card tab
 * @param {string} webUrl - Google Maps web URL
 */
function openGoogleMapsWeb(webUrl) {
  const link = document.createElement('a');
  link.href = webUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
    window.location.href = `intent://www.google.com/maps/search/?api=1&query=${query}#Intent;scheme=https;package=com.google.android.apps.maps;end`;
    scheduleMapsWebFallback(mapsWebUrl);
    return;
  }

  if (isIOSDevice()) {
    window.location.href = `comgooglemaps://?q=${query}`;
    scheduleMapsWebFallback(mapsWebUrl);
    return;
  }

  openGoogleMapsWeb(mapsWebUrl);
}

/**
 * Schedule a mailto fallback only if the app handoff did not occur
 * @param {string} mailtoUrl - mailto fallback URL
 * @param {number} delayMs - Delay before fallback
 */
function scheduleMailtoFallback(mailtoUrl, delayMs = 700) {
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
      window.location.href = mailtoUrl;
    }
  }, delayMs);
}

/**
 * Open Gmail compose — Gmail app first on smartphones, web on desktop
 * @param {string} email - Recipient email address
 */
function openGmailCompose(email) {
  const recipient = email.trim();
  const encoded = encodeURIComponent(recipient);
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encoded}`;
  const mailtoUrl = `mailto:${recipient}`;

  if (!isMobileDevice()) {
    openExternalUrl(gmailWebUrl);
    return;
  }

  if (isAndroidDevice()) {
    window.location.href = `intent://compose?to=${encoded}#Intent;scheme=googlegmail;package=com.google.android.gm;end`;
    scheduleMailtoFallback(mailtoUrl);
    return;
  }

  if (isIOSDevice()) {
    window.location.href = `googlegmail:///co?to=${encoded}`;
    scheduleMailtoFallback(mailtoUrl);
    return;
  }

  openExternalUrl(gmailWebUrl);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isMobileDevice,
    openExternalUrl,
    openMapsForAddress,
    openGmailCompose
  };
}
