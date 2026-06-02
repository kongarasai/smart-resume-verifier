'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ShieldCheck, LogOut, User, Github, Code2, BookOpen, LayoutDashboard, Search, Calendar, MessageSquare, Briefcase, Trophy, Clock, Lock, Users, Settings, Megaphone, PlusCircle, Star, Sparkles, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

const navMap: Record<string, { href: string; label: string; icon: any }[]> = {
  candidate: [
    { href: '/candidate/profile', label: 'My Profile', icon: User },
    { href: '/candidate/groups', label: 'My Groups', icon: Users },
    { href: '/candidate/interview', label: 'Mock Interview', icon: Sparkles },
    { href: '/candidate/github', label: 'GitHub', icon: Github },
    { href: '/candidate/leetcode', label: 'LeetCode', icon: Code2 },
    { href: '/candidate/practice', label: 'Practice', icon: BookOpen },
    { href: '/candidate/ranking', label: 'Rankings', icon: Trophy },
    { href: '/candidate/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/candidate/progress', label: 'Progress', icon: Clock },
    { href: '/candidate/interviews', label: 'Interviews', icon: Calendar },
    { href: '/candidate/messages', label: 'Messages', icon: MessageSquare },
    { href: '/candidate/privacy', label: 'Privacy', icon: Lock },
  ],
  mentor: [
    { href: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/mentor/groups', label: 'Groups', icon: Users },
    { href: '/mentor/problems', label: 'Create Problems', icon: PlusCircle },
    { href: '/mentor/announcements', label: 'Announcements', icon: Megaphone },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/problems', label: 'Create Problems', icon: PlusCircle },
    { href: '/teacher/rankings', label: 'Rankings', icon: Trophy },
  ],
  hr: [
    { href: '/hr/candidates', label: 'Candidates', icon: LayoutDashboard },
    { href: '/hr/analytics', label: 'Talent Analytics', icon: TrendingUp },
    { href: '/hr/shortlist', label: 'Shortlist', icon: Star },
    { href: '/hr/search', label: 'Req. Match', icon: Search },
    { href: '/hr/interviews', label: 'Interviews', icon: Calendar },
    { href: '/hr/messages', label: 'Messages', icon: MessageSquare },
    { href: '/hr/profile', label: 'My Profile', icon: User },
  ],
};

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const nav = mounted ? (navMap[user?.role || 'candidate'] || navMap.candidate) : [];
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '');

  return (
    <aside className={clsx(
      "fixed left-0 top-0 h-screen w-56 bg-ink-900 flex flex-col z-40 transform transition-transform duration-200 ease-in-out md:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="px-4 py-4 border-b border-ink-800">
        <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-ink-300" /><span className="font-display text-sm text-white tracking-tight">ResumeVerify</span></div>
        <div className="mt-3 flex items-center gap-2">
          {mounted && user?.photo_url
            ? <img src={`${apiBase}${user.photo_url}`} className="w-7 h-7 rounded-full object-cover" alt="" />
            : <div className="w-7 h-7 rounded-full bg-ink-700 flex items-center justify-center text-xs text-ink-200 font-medium">{mounted ? user?.full_name?.[0]?.toUpperCase() : ''}</div>
          }
          <div className="min-w-0">
            <p className="text-xs text-white font-medium truncate">{mounted ? user?.full_name : ''}</p>
            <p className="text-xs text-ink-500 capitalize">{mounted ? user?.role : ''}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} onClick={() => setIsOpen(false)} className={clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all',
              active ? 'bg-white text-ink-900 font-medium' : 'text-ink-400 hover:text-white hover:bg-ink-800')}>
              <Icon size={14} />{label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 py-3 border-t border-ink-800">
        <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-xs text-ink-400 hover:text-white hover:bg-ink-800 transition-all">
          <LogOut size={14} />Sign out
        </button>
      </div>
    </aside>
  );
}
