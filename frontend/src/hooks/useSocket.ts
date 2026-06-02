import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const { user, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://enviable-epic-shrunk.ngrok-free.dev';
    
    // Connect with userId in query for targeted notifications
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      query: { userId: user.id },
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Real-time connection established');
    });

    socketRef.current.on('notification', (notif: any) => {
      toast(`${notif.title}: ${notif.message}`, {
        icon: '🔔',
        duration: 5000,
      });
      // You can also trigger a global state update here if needed
      window.dispatchEvent(new CustomEvent('new_notification', { detail: notif }));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, user?.id]);

  return socketRef.current;
};
