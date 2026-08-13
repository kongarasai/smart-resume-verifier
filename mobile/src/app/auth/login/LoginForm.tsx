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
  const [mobileRedirectUrl, setMobileRedirectUrl] = useState<string | null>(null);
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

  // Handle persisted mobile redirection on mount/reload after Google OAuth redirect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = localStorage.getItem('auth_redirect_platform') === 'mobile';
    if (!isMobile) return;

    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const redirectRole = localStorage.getItem('auth_redirect_role') || 'candidate';
          
          const googleUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Candidate',
            role: redirectRole as 'candidate' | 'hr' | 'mentor' | 'teacher',
            photo_url: firebaseUser.photoURL || undefined
          };
          setAuth(googleUser, idToken);

          localStorage.removeItem('auth_redirect_platform');
          localStorage.removeItem('auth_redirect_role');
          localStorage.removeItem('auth_redirect_invite');

          const isAndroid = /Android/i.test(navigator.userAgent);
          const redirectUrl = isAndroid
            ? `intent://oauth-callback?token=${idToken}&role=${redirectRole}#Intent;scheme=com.smartresume.verifier;package=com.smartresume.verifier;end`
            : `com.smartresume.verifier://oauth-callback?token=${idToken}&role=${redirectRole}`;
          
          window.location.href = redirectUrl;
          setMobileRedirectUrl(redirectUrl);
        } catch (e) {
          console.error('Failed to get token for persisted mobile redirect:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle direct login from native Android deep link query params
  useEffect(() => {
    const token = searchParams?.get('token');
    const role = searchParams?.get('role') || 'candidate';
    if (token) {
      const doLogin = async () => {
        const loadingToast = toast.loading('Syncing Google session...');
        try {
          const res = await authAPI.loginWithToken(token);
          if (res?.data?.user) {
            setAuth(res.data.user, res.data.token ?? token);
            toast.dismiss(loadingToast);
            toast.success(`Welcome, ${res.data.user.full_name}!`);
            router.push(ROLE_REDIRECTS[res.data.user.role] || '/candidate/profile');
          }
        } catch (err) {
          try {
            const regRes = await authAPI.registerWithToken(token, { role });
            if (regRes?.data?.user) {
              setAuth(regRes.data.user, regRes.data.token ?? token);
              toast.dismiss(loadingToast);
              toast.success('Google account registered successfully!');
              router.push('/candidate/profile');
            }
          } catch (regErr) {
            toast.dismiss(loadingToast);
            toast.error('Failed to sync authentication session.');
          }
        }
      };
      doLogin();
    }
  }, [searchParams]);

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (!auth || !auth.app) {
      toast.error('Firebase Auth is not configured for this environment. Please check environment variables.');
      return;
    }

    // Custom native Android WebView check
    if (typeof window !== 'undefined' && (window as any).AndroidInterface) {
      try {
        toast.loading('Opening secure browser for Google Sign-In...', { duration: 3000 });
        const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://smart-resume-verifier.vercel.app';
        const targetUrl = `${webUrl}/auth/login?platform=mobile&role=${selectedRole || 'candidate'}${inviteToken ? `&invite=${inviteToken}` : ''}`;
        (window as any).AndroidInterface.openSystemBrowser(targetUrl);
      } catch (e) {
        toast.error('Failed to open system browser.');
      }
      return;
    }


    // Save platform and role/invite to localStorage to survive Firebase OAuth redirects
    const params = new URLSearchParams(window.location.search);
    const isMobileUrl = params.get('platform') === 'mobile';
    if (isMobileUrl) {
      localStorage.setItem('auth_redirect_platform', 'mobile');
      localStorage.setItem('auth_redirect_role', selectedRole || 'candidate');
      if (inviteToken) localStorage.setItem('auth_redirect_invite', inviteToken);
    }

    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const googleUser = {
        id: result.user.uid,
        email: result.user.email || '',
        full_name: result.user.displayName || result.user.email?.split('@')[0] || 'Candidate',
        role: (selectedRole || 'candidate') as 'candidate' | 'hr' | 'mentor' | 'teacher',
        photo_url: result.user.photoURL || undefined
      };

      // Set user session in local store immediately for instant UI response
      setAuth(googleUser, idToken);
      toast.success(`Welcome, ${googleUser.full_name}!`);

      // If we are on the Web page serving a mobile redirect authentication request
      const isMobile = localStorage.getItem('auth_redirect_platform') === 'mobile' || isMobileUrl;
      const redirectRole = localStorage.getItem('auth_redirect_role') || googleUser.role;
      
      localStorage.removeItem('auth_redirect_platform');
      localStorage.removeItem('auth_redirect_role');
      localStorage.removeItem('auth_redirect_invite');

      if (isMobile) {
        const isAndroid = /Android/i.test(navigator.userAgent);
        const redirectUrl = isAndroid
          ? `intent://oauth-callback?token=${idToken}&role=${redirectRole}#Intent;scheme=com.smartresume.verifier;package=com.smartresume.verifier;end`
          : `com.smartresume.verifier://oauth-callback?token=${idToken}&role=${redirectRole}`;
        window.location.href = redirectUrl;
        setMobileRedirectUrl(redirectUrl);
        return;
      }

      router.push(ROLE_REDIRECTS[googleUser.role] || '/candidate/profile');

      // Sync user profile with selected role
      if (isRegister) {
        try {
          const regRes = await authAPI.registerWithToken(idToken, {
            role: selectedRole || 'hr',
            ...(inviteToken ? { invite_token: inviteToken } : {}),
          });
          if (regRes?.data?.user) setAuth(regRes.data.user, regRes.data.token ?? idToken);
        } catch {
          // If already exists, log in
          const loginRes = await authAPI.loginWithToken(idToken);
          if (loginRes?.data?.user) setAuth(loginRes.data.user, loginRes.data.token ?? idToken);
        }
      } else {
        authAPI.loginWithToken(idToken)
          .then((res: any) => {
            if (res?.data?.user) {
              setAuth(res.data.user, res.data.token ?? idToken);
            }
          })
          .catch((err: any) => {
            if (err.response?.status === 404) {
              authAPI.registerWithToken(idToken, {
                role: selectedRole || 'candidate',
                ...(inviteToken ? { invite_token: inviteToken } : {}),
              }).then((regRes: any) => {
                if (regRes?.data?.user) setAuth(regRes.data.user, regRes.data.token ?? idToken);
              }).catch(() => {});
            }
          });
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
      // Catch the "missing initial state" sessionStorage error from WebViews
      if (err.message?.includes('missing initial state') || err.message?.includes('sessionStorage')) {
        toast.error('Google Sign-In is not supported in this environment. Please use Email & Password.', { duration: 5000 });
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
        
        // Handle mobile redirect
        const params = new URLSearchParams(window.location.search);
        const isMobile = localStorage.getItem('auth_redirect_platform') === 'mobile' || params.get('platform') === 'mobile';
        const redirectRole = localStorage.getItem('auth_redirect_role') || res.data.user.role;
        localStorage.removeItem('auth_redirect_platform');
        localStorage.removeItem('auth_redirect_role');
        localStorage.removeItem('auth_redirect_invite');
        
        if (isMobile) {
          const isAndroid = /Android/i.test(navigator.userAgent);
          const redirectUrl = isAndroid
            ? `intent://oauth-callback?token=${idToken}&role=${redirectRole}#Intent;scheme=com.smartresume.verifier;package=com.smartresume.verifier;end`
            : `com.smartresume.verifier://oauth-callback?token=${idToken}&role=${redirectRole}`;
          window.location.href = redirectUrl;
          setMobileRedirectUrl(redirectUrl);
          return;
        }

        router.push(ROLE_REDIRECTS[res.data.user.role] || '/candidate/profile');
      } else {
        const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
        idToken = await credential.user.getIdToken();
        const res = await authAPI.loginWithToken(idToken);
        setAuth(res.data.user, res.data.token ?? idToken);
        toast.success(`Welcome back, ${res.data.user.full_name}!`);
        
        // Handle mobile redirect
        const params = new URLSearchParams(window.location.search);
        const isMobile = localStorage.getItem('auth_redirect_platform') === 'mobile' || params.get('platform') === 'mobile';
        const redirectRole = localStorage.getItem('auth_redirect_role') || res.data.user.role;
        localStorage.removeItem('auth_redirect_platform');
        localStorage.removeItem('auth_redirect_role');
        localStorage.removeItem('auth_redirect_invite');
        
        if (isMobile) {
          const isAndroid = /Android/i.test(navigator.userAgent);
          const redirectUrl = isAndroid
            ? `intent://oauth-callback?token=${idToken}&role=${redirectRole}#Intent;scheme=com.smartresume.verifier;package=com.smartresume.verifier;end`
            : `com.smartresume.verifier://oauth-callback?token=${idToken}&role=${redirectRole}`;
          window.location.href = redirectUrl;
          setMobileRedirectUrl(redirectUrl);
          return;
        }

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

  if (mobileRedirectUrl) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-display font-bold text-amber-400">Successfully Signed In!</h2>
            <p className="text-ink-300 text-sm">
              Your Google authentication is complete. Tap the button below to return to the Smart Resume mobile app.
            </p>
          </div>
          <div className="pt-4">
            <a 
              href={mobileRedirectUrl}
              className="w-full inline-flex items-center justify-center px-6 py-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-ink-950 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Open Smart Resume App
            </a>
          </div>
          <p className="text-xs text-ink-500 font-mono pt-8">
            If the app did not open automatically, tap the button above.
          </p>
        </div>
      </div>
    );
  }

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

          {/* ── Role Selector for Registration ── */}
          {isRegister && !inviteToken && (
            <div className="mb-6">
              <label className="label mb-2">Select Your Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(({ value, label, icon, desc }) => (
                  <label key={value} className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all ${selectedRole === value ? 'border-ink-900 bg-ink-100 ring-2 ring-ink-900' : 'border-ink-200 bg-white hover:border-ink-300'}`}>
                    <input {...register('role')} type="radio" value={value} className="sr-only" />
                    <span className="text-base">{icon}</span>
                    <span className="text-sm font-medium text-ink-900">{label}</span>
                    <span className="text-xs text-ink-500">{desc}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Google Button ── */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 transition-all font-semibold text-ink-900 text-base shadow-sm disabled:opacity-60 hover:shadow"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-ink-300 border-t-ink-800 rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-ink-500 text-sm mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsRegister(!isRegister)} className="text-ink-900 font-semibold underline underline-offset-2">
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
