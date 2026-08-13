import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Resume Truth Verifier',
  description: 'Evidence-based candidate verification platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e1b17" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-ink-50 text-ink-900 antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e1b17', color: '#f5f4f0', borderRadius: '8px', border: '1px solid #4d4840' },
              success: { iconTheme: { primary: '#2d9e5f', secondary: '#f5f4f0' } },
              error: { iconTheme: { primary: '#c0392b', secondary: '#f5f4f0' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
