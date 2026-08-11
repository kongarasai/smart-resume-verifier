import { Capacitor } from '@capacitor/core';

/**
 * Utility functions for platform detection.
 */
export const platformUtils = {
  /**
   * Returns true if the app is currently running as a native app (iOS or Android) via Capacitor.
   */
  isNative: (): boolean => {
    return Capacitor.isNativePlatform();
  },

  /**
   * Returns true if the app is currently running on iOS.
   */
  isIOS: (): boolean => {
    return Capacitor.getPlatform() === 'ios';
  },

  /**
   * Returns true if the app is currently running on Android.
   */
  isAndroid: (): boolean => {
    return Capacitor.getPlatform() === 'android';
  },

  /**
   * Returns true if the app is currently running on the web (browser).
   */
  isWeb: (): boolean => {
    return Capacitor.getPlatform() === 'web';
  },

  /**
   * Returns the current platform ('web', 'ios', 'android').
   */
  getPlatform: (): string => {
    return Capacitor.getPlatform();
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

