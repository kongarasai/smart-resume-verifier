'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

const ROLES = [
  { value: 'candidate', label: 'Candidate',  icon: '👤', desc: 'Submit & verify profile' },
  { value: 'mentor',    label: 'Mentor',     icon: '🎓', desc: 'Create groups & guide' },
  { value: 'teacher',   label: 'Teacher',    icon: '📚', desc: 'Add problems & notes' },
  { value: 'hr',        label: 'HR',         icon: '💼', desc: 'Search & evaluate' },
];

const ROLE_REDIRECTS: Record<string, string> = {
  candidate: '/candidate/profile',
  mentor:    '/mentor/dashboard',
  teacher:   '/teacher/dashboard',
  hr:        '/hr/candidates',
};

/** Get a Firebase ID token and sync with our backend, then navigate */
const syncWithBackend = async (
  firebaseIdToken: string,
  extraBody: Record<string, string> = {},
  isRegister: boolean,
  setAuth: Function,
  router: any
) => {
  // Send Firebase ID token to backend via Authorization header
  const res = isRegister
    ? await authAPI.register({ ...extraBody })   // backend reads token from Authorization header
    : await authAPI.login({});                    // backend reads token from Authorization header

  // Store JWT + user in store
  setAuth(res.data.user, res.data.token ?? firebaseIdToken);
  toast.success(isRegister ? 'Account created!' : `Welcome back, ${res.data.user.full_name}!`);
  router.push(ROLE_REDIRECTS[res.data.user.role] || '/candidate/profile');
};

export default function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router      = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams?.get('invite');

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<{
    role: string; full_name?: string; email?: string; password?: string;
  }>({ defaultValues: { role: 'candidate' } });

  const selectedRole = watch('role');

  useEffect(() => { if (inviteToken) { setIsRegister(true); setValue('role', 'candidate'); } }, [inviteToken]);
  useEffect(() => { if (isRegister && !watch('role')) setValue('role', 'candidate'); }, [isRegister]);

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (!auth || !auth.app) {
      toast.error('Firebase Auth is not configured for this environment. Please check environment variables.');
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      if (isRegister) {
        // Registering
        const res = await authAPI.registerWithToken(idToken, {
          role: selectedRole || 'candidate',
          ...(inviteToken ? { invite_token: inviteToken } : {}),
        });
        setAuth(res.data.user, res.data.token ?? idToken);
        toast.success('Account created with Google!');
        router.push(ROLE_REDIRECTS[res.data.user.role] || '/candidate/profile');
      } else {
        // Logging in
        try {
          let res;
          try {
            res = await authAPI.loginWithToken(idToken);
          } catch (firstErr: any) {
            if (firstErr.message === 'Network Error' || firstErr.code === 'ECONNABORTED') {
              toast.loading('Server spinning up, syncing session...', { id: 'auth-sync' });
              await new Promise(r => setTimeout(r, 3000));
              res = await authAPI.loginWithToken(idToken);
              toast.dismiss('auth-sync');
            } else {
              throw firstErr;
            }
          }
          setAuth(res.data.user, res.data.token ?? idToken);
          toast.success(`Welcome, ${res.data.user.full_name}!`);
          router.push(ROLE_REDIRECTS[res.data.user.role] || '/candidate/profile');
        } catch (err: any) {
          if (err.response?.status === 404) {
            // Auto-register as candidate if login failed because profile wasn't found
            toast.loading('Creating your profile...', { id: 'google-reg' });
            try {
              const res = await authAPI.registerWithToken(idToken, {
                role: 'candidate',
                ...(inviteToken ? { invite_token: inviteToken } : {}),
              });
              toast.dismiss('google-reg');
              setAuth(res.data.user, res.data.token ?? idToken);
              toast.success('Welcome! Your account has been created.');
              router.push(ROLE_REDIRECTS[res.data.user.role] || '/candidate/profile');
            } catch (regErr: any) {
              toast.dismiss('google-reg');
              // Fallback client session if backend cold start persists
              const googleUser = {
                id: result.user.uid,
                email: result.user.email || '',
                full_name: result.user.displayName || 'Google User',
                role: 'candidate' as const,
                photo_url: result.user.photoURL || undefined
              };
              setAuth(googleUser, idToken);
              toast.success(`Welcome, ${googleUser.full_name}!`);
              router.push('/candidate/profile');
            }
          } else if (err.message === 'Network Error' || err.code === 'ECONNABORTED' || !err.response) {
            // Instant offline/cold-start fallback for Google authenticated users
            const googleUser = {
              id: result.user.uid,
              email: result.user.email || '',
              full_name: result.user.displayName || 'Google User',
              role: 'candidate' as const,
              photo_url: result.user.photoURL || undefined
            };
            setAuth(googleUser, idToken);
            toast.success(`Welcome, ${googleUser.full_name}!`);
            router.push('/candidate/profile');
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return; // user cancelled — no toast
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        toast.error('Domain not authorized in Firebase Console. Add smart-resume-verifier.vercel.app to Firebase Auth > Settings > Authorized domains.', { duration: 8000 });
        return;
      }
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        toast.error('Google Sign-In is not enabled in Firebase. Go to Firebase Console > Authentication > Sign-in method and enable Google.', { duration: 8000 });
        return;
      }
      const msg = err.response?.data?.error || err.message || 'Google sign-in failed';
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Email / Password ──────────────────────────────────────────────────────
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      let idToken: string;

      if (isRegister) {
        const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        idToken = await credential.user.getIdToken();
        const res = await authAPI.registerWithToken(idToken, {
          email: data.email,
          full_name: data.full_name,
          role: data.role || 'candidate',
          ...(inviteToken ? { invite_token: inviteToken } : {}),
        });
        setAuth(res.data.user, res.data.token ?? idToken);
        toast.success('Account created!');
        router.push(ROLE_REDIRECTS[res.data.user.role] || '/candidate/profile');
      } else {
        const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
        idToken = await credential.user.getIdToken();
        const res = await authAPI.loginWithToken(idToken);
        setAuth(res.data.user, res.data.token ?? idToken);
        toast.success(`Welcome back, ${res.data.user.full_name}!`);
        router.push(ROLE_REDIRECTS[res.data.user.role] || '/candidate/profile');
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      // Firebase client errors
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Invalid email or password');
      } else if (code === 'auth/email-already-in-use') {
        toast.error('Email already registered. Try signing in instead.');
        setIsRegister(false);
      } else if (code === 'auth/weak-password') {
        toast.error('Password must be at least 6 characters');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please wait a few minutes.');
      } else {
        const msg = err.response?.data?.error || err.message || 'Something went wrong';
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
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
            {[['GitHub API','Real repos & commits'],['LeetCode','Live profile data'],['Practice','Verified scores'],['Rankings','Fair competition']].map(([t,d]) => (
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
            <ShieldCheck className="text-ink-900" size={22} />
            <span className="font-display text-lg text-ink-900">ResumeVerify</span>
          </div>

          {inviteToken && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-xs text-green-700">
              🎉 You've been invited to join a group! Register to automatically join.
            </div>
          )}

          <h2 className="font-display text-3xl text-ink-900 mb-1">
            {isRegister ? 'Create account' : 'Sign in'}
          </h2>
          <p className="text-ink-500 mb-6 text-sm">
            {isRegister ? 'Join the platform.' : 'Access your dashboard.'}
          </p>

          {/* ── Google Button ── */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-4 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 transition-colors font-medium text-ink-800 text-sm shadow-sm disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-ink-300 border-t-ink-800 rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ink-200" />
            <span className="text-xs text-ink-400">or</span>
            <div className="flex-1 h-px bg-ink-200" />
          </div>

          {/* ── Email / Password Form ── */}
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
                <input {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })} type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-ink-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
            </div>

            {isRegister && !inviteToken && (
              <div>
                <label className="label">I am a...</label>
                <div className="grid grid-cols-2 gap-2">
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

            <button type="submit" id="email-signin-btn" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isRegister ? 'Creating...' : 'Signing in...'}</span>
                : isRegister ? 'Create account' : 'Sign in'}
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
