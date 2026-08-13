'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

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
    if (typeof window !== 'undefined') {
      (window as any).handleNativeGoogleLogin = async (token: string, role: string) => {
        const loadingToast = toast.loading('Syncing Google session...');
        try {
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
      };
    }

  }, [setAuth, router]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
