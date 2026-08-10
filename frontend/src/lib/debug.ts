const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const sendDebugLog = async (message: string, level: 'info' | 'warn' | 'error' = 'info', context?: any) => {
  try {
    const finalToken = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    // Read CSRF token from cookie (set by backend on first load)
    const csrfToken = typeof document !== 'undefined'
      ? document.cookie.split('; ').find(r => r.startsWith('csrf-token='))?.split('=')[1]
      : undefined;

    await fetch(`${API_URL}/debug/log`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...(finalToken ? { 'Authorization': `Bearer ${finalToken}` } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify({ level, message, context: { ...context, timestamp: new Date().toISOString() } }),
    });
  } catch (e) {
    console.error('Failed to send debug log', e);
  }
};
