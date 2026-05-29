/**
 * Web Share API with clipboard fallback
 */

/**
 * Share the business card URL
 * @param {Object} data - Card configuration object
 * @returns {Promise<string>} Result type: 'shared', 'copied', or 'failed'
 */
async function shareCard(data) {
  const owner = data.owner || {};
  const shareData = {
    title: `${owner.fullName || 'Digital Business Card'} - ${owner.role || ''}`.trim(),
    text: owner.bio || owner.slogan || '',
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(window.location.href);
    return 'copied';
  }

  return 'failed';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { shareCard };
}
