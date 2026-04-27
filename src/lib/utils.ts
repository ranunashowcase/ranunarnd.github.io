/**
 * Format a number as Indonesian Rupiah currency.
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format an ISO datetime string to a readable Indonesian format.
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/**
 * Truncate a string to a maximum length.
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Classname utility for conditional classes.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Convert Google Drive sharing URL to a direct image render URL
 */
export function getDirectImageUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

/**
 * Extract TikTok video ID and return embed URL
 */
export function getTikTokEmbedUrl(url: string): string | null {
  if (!url) return null;
  // Match standard tiktok URLs like: https://www.tiktok.com/@user/video/1234567890
  const match = url.match(/\/video\/(\d+)/);
  if (match && match[1]) {
    return `https://www.tiktok.com/embed/v2/${match[1]}`;
  }
  return null;
}
