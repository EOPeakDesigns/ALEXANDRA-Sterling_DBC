/**
 * vCard generation and download utilities
 */

/**
 * Build a vCard 3.0 string from card data
 * @param {Object} data - Card configuration object
 * @returns {string} vCard content
 */
function buildVCard(data) {
  const owner = data.owner || {};
  const contact = data.contact || {};
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${owner.fullName || ''}`,
    `N:${owner.lastName || ''};${owner.firstName || ''};;;`,
    owner.role ? `TITLE:${owner.role}` : null,
    contact.phoneRaw ? `TEL;TYPE=CELL:${contact.phoneRaw}` : null,
    contact.email ? `EMAIL;TYPE=INTERNET:${contact.email}` : null,
    contact.websiteUrl ? `URL:${contact.websiteUrl}` : null,
    contact.address ? `ADR;TYPE=WORK:;;${contact.address};;;;` : null,
    owner.bio ? `NOTE:${owner.bio}` : null,
    'END:VCARD'
  ];

  return lines.filter(Boolean).join('\r\n');
}

/**
 * Download a vCard file on mobile and desktop
 * @param {Object} data - Card configuration object
 * @returns {boolean} Whether download was initiated
 */
function downloadVCard(data) {
  const owner = data.owner || {};
  const vcardContent = buildVCard(data);
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `${(owner.fullName || 'contact').replace(/\s+/g, '-').toLowerCase()}.vcf`;

  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildVCard, downloadVCard };
}
