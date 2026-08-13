'use client';

import React, { useEffect, useState } from 'react';
import { platformUtils } from '@/utils/platform';

interface PlatformViewProps {
  web: React.ReactNode;
  mobile: React.ReactNode;
}

/**
 * PlatformView helps separate Web and Mobile UI components into different files/views.
 * It detects if the app is running in a native wrapper/WebView (iOS/Android) 
 * and renders the appropriate component.
 */
export default function PlatformView({ web, mobile }: PlatformViewProps) {
  const [isNative, setIsNative] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the current platform is native
    setIsNative(platformUtils.isNative());
  }, []);

  // Avoid rendering until platform is determined to prevent hydration mismatches
  if (isNative === null) {
    return null; 
  }

  return <>{isNative ? mobile : web}</>;
}
