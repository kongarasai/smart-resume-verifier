import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, practiceAPI, jobAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

// ── AUTH HOOKS ──
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: authAPI.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    },
  });
};

// ── PRACTICE HOOKS ──
export const useAssignments = () => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: practiceAPI.getAssignments,
  });
};

export const useJobStatus = (jobId: string | null) => {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobAPI.getStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const state = (query.state.data as any)?.state;
      return state === 'completed' || state === 'failed' ? false : 3000;
    },
  });
};

export const useGenerateQuestions = () => {
  return useMutation({
    mutationFn: practiceAPI.generateQuestions,
    onSuccess: () => {
      toast.success('Generation started in background!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to start generation');
    }
  });
};
