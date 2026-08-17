'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/shared/Sidebar';
import NotificationBell from '@/components/shared/NotificationBell';
import { useSocket } from '@/hooks/useSocket';
import { Menu, ArrowLeft } from 'lucide-react';
import { sendDebugLog } from '@/lib/debug';

type Role = 'candidate' | 'mentor' | 'teacher' | 'hr';

export default function DashboardLayout({ children, requiredRole }: { children: React.ReactNode; requiredRole?: Role }) {
  const { user, isLoading, initFromStorage } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const [safetyLoading, setSafetyLoading] = useState(true);
  
  // Initialize global socket connection for notifications
  useSocket();

  useEffect(() => { 
    initFromStorage();
    const timer = setTimeout(() => setSafetyLoading(false), 100);
    
    // Global navigation interceptor for debugging mobile redirects
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      sendDebugLog(`[HISTORY PUSH] ${args[2]}`, 'info');
      return originalPushState.apply(this, args);
    };
    
    window.history.replaceState = function(...args) {
      sendDebugLog(`[HISTORY REPLACE] ${args[2]}`, 'warn');
      return originalReplaceState.apply(this, args);
    };
    
    window.addEventListener('popstate', () => {
      sendDebugLog(`[HISTORY POP] ${window.location.pathname}`, 'warn');
    });

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const path = (pathname || '').toLowerCase();
      const isStaff = user && ['hr', 'mentor', 'teacher'].includes(user.role);
      const isSharedRoute = 
        path.includes('candidates') || 
        path.includes('profile') || 
        path.includes('view') || 
        path.includes('assignments') || 
        path.includes('groups') || 
        path.includes('interview');

      if (isStaff && isSharedRoute) {
        sendDebugLog(`[FORCE BYPASS] Staff Access: role=${user?.role}, path=${path}`, 'info');
        return;
      }

      sendDebugLog(`DashboardLayout Check: user=${user?.email}, role=${user?.role}, path=${pathname}, required=${requiredRole}`);
      
      if (!user) { 
        // Force staff bypass even if user is null (fallback to storage check)
        const storageUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const storageUser = storageUserStr ? JSON.parse(storageUserStr) : null;
        if (isSharedRoute && storageUser && ['hr', 'mentor', 'teacher'].includes(storageUser.role)) {
          sendDebugLog(`[DELAYED BYPASS] Staff detected from storage: ${storageUser.role}`, 'info');
          return;
        }

        const timer = setTimeout(() => {
          if (!useAuthStore.getState().user) {
            sendDebugLog('No user found after delay, redirecting to login', 'warn');
            router.replace('/auth/login'); 
          }
        }, 200);
        return () => clearTimeout(timer);
      }
      
      if (requiredRole && user.role !== requiredRole) {
        const target = {
          candidate: '/candidate/profile', mentor: '/mentor/dashboard',
          teacher: '/teacher/dashboard', hr: '/hr/candidates',
        }[user.role as Role] || '/auth/login';
        
        sendDebugLog(`[REDIRECT] role=${user.role}, path=${path}, target=${target}`, 'warn');
        router.replace(target);
      }
    }
  }, [user, isLoading, requiredRole, pathname, safetyLoading]);

  // console.log('[DashboardLayout] Render:', { isLoading, safetyLoading, user: !!user, pathname });

  /*
  if (isLoading && safetyLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  */

  // If no user but we are on a shared route, allow rendering (auth will catch up)
  const isShared = (pathname || '').toLowerCase().includes('view') || (pathname || '').toLowerCase().includes('candidates');
  // Hydration safety: ensure server and client initial render match
  if (!mounted && !isShared) return null;
  if (mounted && !user && !isShared) return null;

  return (
    <div className="flex min-h-screen relative">
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 w-full md:ml-56 min-h-screen bg-ink-50 flex flex-col">
        <div className="bg-ink-900 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-sm">
          <span>Welcome, {mounted && user ? (user.full_name || user.email?.split('@')[0] || 'User') : 'User'}!</span>
          <span className="text-[10px] text-ink-400 font-mono">Smart Resume Verifier</span>
        </div>
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-ink-50/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button 
              className="md:hidden p-2 rounded-lg bg-white border border-ink-200 text-ink-900 shadow-sm"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-ink-400 tracking-widest leading-none">Role: {mounted ? user?.role : ''}</span>
              <span className="text-[9px] text-ink-300 font-mono mt-1">{mounted ? pathname : ''}</span>
            </div>
            <NotificationBell />
          </div>
        </div>
        <div className="max-w-5xl mx-auto w-full p-4 md:p-8 pt-0 overflow-x-clip">{children}</div>
      </main>
    </div>
  );
}
