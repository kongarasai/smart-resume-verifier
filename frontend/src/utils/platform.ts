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
