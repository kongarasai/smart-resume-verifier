'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const { setAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleAppUrlOpen = async (event: any) => {
      const url = event.url;
      if (url.includes('com.smartresume.verifier://oauth-callback')) {
        // Close the custom browser tab
        try {
          const { Browser } = require('@capacitor/browser');
          await Browser.close();
        } catch (_) {}

        // Parse query params
        const queryParamsStr = url.split('?')[1] || '';
        const params = new URLSearchParams(queryParamsStr);
        const token = params.get('token');
        const role = params.get('role') || 'candidate';

        if (!token) {
          toast.error('Google authentication failed. No token received.');
          return;
        }

        const loadingToast = toast.loading('Syncing Google session...');
        try {
          // Sync with backend to get the actual user object
          const res = await authAPI.loginWithToken(token);
          if (res?.data?.user) {
            setAuth(res.data.user, res.data.token ?? token);
            toast.dismiss(loadingToast);
            toast.success(`Welcome, ${res.data.user.full_name}!`);
            const targetRedirect = ({
              candidate: '/candidate/profile',
              mentor: '/mentor/dashboard',
              teacher: '/teacher/dashboard',
              hr: '/hr/candidates',
            } as any)[res.data.user.role] || '/candidate/profile';
            router.push(targetRedirect);
          } else {
            throw new Error('No user data returned');
          }
        } catch (err) {
          // If the user profile doesn't exist yet, we attempt to register
          try {
            const regRes = await authAPI.registerWithToken(token, { role });
            if (regRes?.data?.user) {
              setAuth(regRes.data.user, regRes.data.token ?? token);
              toast.dismiss(loadingToast);
              toast.success('Google account registered successfully!');
              router.push('/candidate/profile');
            } else {
              throw new Error('Registration failed');
            }
          } catch (regErr: any) {
            toast.dismiss(loadingToast);
            toast.error('Failed to sync authentication session.');
          }
        }
      }
    };

    // Register deep link listener
    const { App } = require('@capacitor/app');
    const listenerPromise = App.addListener('appUrlOpen', handleAppUrlOpen);

    // Check if app was launched via deep link initially
    App.getLaunchUrl().then((launchUrlObj: any) => {
      if (launchUrlObj?.url) {
        handleAppUrlOpen({ url: launchUrlObj.url });
      }
    });

    return () => {
      listenerPromise.then((listener: any) => listener.remove());
    };
  }, [setAuth, router]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
