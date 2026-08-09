'use client';

import React from 'react';
import PlatformView from '@/components/PlatformView';

export default function PlatformTestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">PlatformView Test</h1>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <PlatformView 
          web={
            <div className="p-4 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold mb-2">Web View</h2>
              <p>This is the web-specific component. You should see this when viewing in a standard browser.</p>
            </div>
          }
          mobile={
            <div className="p-4 bg-green-100 text-green-800 rounded-lg border border-green-200">
              <h2 className="text-xl font-semibold mb-2">Mobile View</h2>
              <p>This is the mobile-specific component. You should see this when viewing in a Capacitor native app.</p>
            </div>
          }
        />
      </div>
    </div>
  );
}
