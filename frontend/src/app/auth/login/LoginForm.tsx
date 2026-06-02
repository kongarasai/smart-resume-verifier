'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

const ROLES = [
  { value: 'candidate', label: 'Candidate', icon: '👤', desc: 'Submit & verify profile' },
  { value: 'mentor', label: 'Mentor', icon: '🎓', desc: 'Create groups & guide' },
  { value: 'teacher', label: 'Teacher', icon: '📚', desc: 'Add problems & notes' },
  { value: 'hr', label: 'HR', icon: '💼', desc: 'Search & evaluate' },
];

const ROLE_REDIRECTS: Record<string, string> = {
  candidate: '/candidate/profile', mentor: '/mentor/dashboard',
  teacher: '/teacher/dashboard', hr: '/hr/candidates',
};

export default function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams?.get('invite');

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<{
    role: string;
    full_name?: string;
    email?: string;
    password?: string;
  }>({ defaultValues: { role: 'candidate' } });
  const selectedRole = watch('role');

  useEffect(() => { if (inviteToken) { setIsRegister(true); setValue('role', 'candidate'); } }, [inviteToken]);
  useEffect(() => {
    if (isRegister && !watch('role')) {
      setValue('role', 'candidate');
    }
  }, [isRegister]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = { ...data, ...(inviteToken ? { invite_token: inviteToken } : {}) };
      const res = isRegister ? await authAPI.register(payload) : await authAPI.login(payload);
      setAuth(res.data.user, res.data.token);
      toast.success(isRegister ? 'Account created!' : `Welcome back, ${res.data.user.full_name}!`);
      router.push(ROLE_REDIRECTS[res.data.user.role] || '/candidate/profile');
    } catch (err: any) {
      console.error('Login Error:', err);
      let msg = err.response?.data?.error || err.message || 'Something went wrong';
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        const errorsList = [];
        for (const key in details) {
          if (key !== '_errors' && details[key]?._errors) {
            errorsList.push(`${key}: ${details[key]._errors.join(', ')}`);
          }
        }
        if (errorsList.length > 0) {
          msg = `${msg} (${errorsList.join('; ')})`;
        }
      }
      toast.error(`Error: ${msg}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-16 bg-ink-900">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-ink-300" size={26} />
          <span className="font-display text-lg text-white tracking-tight">ResumeVerify</span>
        </div>
        <div>
          <h1 className="font-display text-5xl text-white leading-tight mb-6">Truth behind<br />every resume.</h1>
          <p className="text-ink-300 text-base leading-relaxed max-w-sm mb-10">
            Evidence-based verification using real GitHub data, LeetCode statistics, and practice performance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[['GitHub API', 'Real repos & commits'],['LeetCode', 'Live profile data'],['Practice', 'Verified scores'],['Rankings', 'Fair competition']].map(([t,d]) => (
              <div key={t} className="border-t border-ink-700 pt-3">
                <div className="text-xs font-mono text-ink-400 mb-1">{t}</div>
                <div className="text-sm text-ink-200">{d}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-ink-600 text-xs font-mono">© 2025 Smart Resume Verifier</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-ink-50">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <ShieldCheck className="text-ink-900" size={22} /><span className="font-display text-lg text-ink-900">ResumeVerify</span>
          </div>
          {inviteToken && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-xs text-green-700">
              🎉 You've been invited to join a group! Register to automatically join.
            </div>
          )}
          <h2 className="font-display text-3xl text-ink-900 mb-1">{isRegister ? 'Create account' : 'Sign in'}</h2>
          <p className="text-ink-500 mb-6 text-sm">{isRegister ? 'Join the platform.' : 'Access your dashboard.'}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegister && (
              <div>
                <label className="label">Full name</label>
                <input {...register('full_name', { required: 'Name required' })} className="input" placeholder="Jane Smith" />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message as string}</p>}
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input {...register('email', { required: 'Email required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })} type="email" className="input" placeholder="you@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } })} type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-ink-400">{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
            </div>
            {isRegister && !inviteToken && (
              <div>
                <label className="label">I am a...</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ROLES.map(({ value, label, icon, desc }) => (
                    <label key={value} className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all ${selectedRole === value ? 'border-ink-900 bg-ink-100' : 'border-ink-200 bg-white hover:border-ink-300'}`}>
                      <input {...register('role')} type="radio" value={value} className="sr-only" />
                      <span className="text-base">{icon}</span>
                      <span className="text-sm font-medium text-ink-900">{label}</span>
                      <span className="text-xs text-ink-500">{desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isRegister ? 'Creating...' : 'Signing in...'}</span> : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-ink-500 text-sm mt-5">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsRegister(!isRegister)} className="text-ink-900 underline underline-offset-2">
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
