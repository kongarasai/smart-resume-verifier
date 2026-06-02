'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const REDIRECTS: Record<string, string> = {
  candidate: '/candidate/profile', mentor: '/mentor/dashboard',
  teacher: '/teacher/dashboard', hr: '/hr/candidates',
};

export default function Home() {
  const router = useRouter();
  const { user, initFromStorage, isLoading } = useAuthStore();

  useEffect(() => { initFromStorage(); }, []);
  useEffect(() => {
    if (!isLoading) {
      if (typeof window !== 'undefined' && window.location.search.includes('id=')) {
        const sid = new URLSearchParams(window.location.search).get('id');
        console.log('[HOME] Redirecting to profile:', sid);
        router.replace(`/candidates/view/?id=${sid}`);
        return;
      }
      if (!user) router.replace('/auth/login');
      else router.replace(REDIRECTS[user.role] || '/auth/login');
    }
  }, [user, isLoading]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50 gap-4">
      <div className="bg-green-600 text-white p-1 text-[8px] font-bold uppercase rounded">Home Redirecting...</div>
      <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
