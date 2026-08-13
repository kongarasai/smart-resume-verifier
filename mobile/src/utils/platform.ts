/**
 * Utility functions for platform detection.
 */
export const platformUtils = {
  /**
   * Returns true if the app is currently running as a native app (iOS or Android).
   */
  isNative: (): boolean => {
    return typeof window !== 'undefined' && !!(window as any).AndroidInterface;
  },

  /**
   * Returns true if the app is currently running on iOS.
   */
  isIOS: (): boolean => {
    return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  },

  /**
   * Returns true if the app is currently running on Android.
   */
  isAndroid: (): boolean => {
    return typeof window !== 'undefined' && (!!(window as any).AndroidInterface || /Android/i.test(navigator.userAgent));
  },

  /**
   * Returns true if the app is currently running on the web (browser).
   */
  isWeb: (): boolean => {
    return typeof window !== 'undefined' && !(window as any).AndroidInterface;
  },

  /**
   * Returns the current platform ('web', 'ios', 'android').
   */
  getPlatform: (): string => {
    if (typeof window !== 'undefined' && (window as any).AndroidInterface) return 'android';
    if (typeof navigator !== 'undefined') {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'ios';
      if (/Android/i.test(navigator.userAgent)) return 'android';
    }
    return 'web';
  }
};

/**
 * Helper to safely format image URLs (e.g. photo_url, attachment_url)
 * across Render production backend, local environment, and external URLs.
 */
export function getImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://smart-resume-backend-7jeu.onrender.com/api').replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${apiBase}${cleanPath}`;
}
