const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://enviable-epic-shrunk.ngrok-free.dev/api';

export const sendDebugLog = async (message: string, level: 'info' | 'warn' | 'error' = 'info', context?: any) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
    // Extract token if using zustand persist
    let finalToken = '';
    if (token) {
      try {
        const parsed = JSON.parse(token);
        finalToken = parsed.state?.token || '';
      } catch { /* ignore */ }
    }

    await fetch(`${API_URL}/debug/log`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(finalToken ? { 'Authorization': `Bearer ${finalToken}` } : {})
      },
      body: JSON.stringify({ level, message, context: { ...context, timestamp: new Date().toISOString() } }),
    });
  } catch (e) {
    console.error('Failed to send debug log', e);
  }
};
