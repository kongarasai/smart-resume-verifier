import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-ink-900"><div className="w-8 h-8 border-4 border-ink-300 border-t-white rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
