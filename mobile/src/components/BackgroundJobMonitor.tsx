'use client';

import { useJobStatus } from '@/hooks/useQueries';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Props {
  jobId: string | null;
  onComplete?: (result: any) => void;
  onClose?: () => void;
}

export default function BackgroundJobMonitor({ jobId, onComplete, onClose }: Props) {
  const { data: job, isLoading, error } = useJobStatus(jobId);

  useEffect(() => {
    if (job?.state === 'completed') {
      toast.success('Task completed successfully!');
      if (onComplete) onComplete(job.result);
    }
    if (job?.state === 'failed') {
      toast.error(`Task failed: ${job.reason || 'Unknown error'}`);
    }
  }, [job?.state, job?.result, job?.reason, onComplete]);

  if (!jobId) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-ink-900 border border-ink-700 rounded-xl shadow-2xl p-4 text-ink-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          {job?.state === 'active' || job?.state === 'waiting' || isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
          ) : job?.state === 'completed' ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          {job?.state === 'completed' ? 'Processing Complete' : 'Processing in Background'}
        </h4>
        <button onClick={onClose} className="text-ink-400 hover:text-ink-200 text-xs">Dismiss</button>
      </div>

      <div className="space-y-2">
        <div className="h-1.5 w-full bg-ink-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              job?.state === 'completed' ? 'bg-green-500 w-full' : 
              job?.state === 'failed' ? 'bg-red-500 w-full' : 'bg-gold-500 w-1/2'
            }`}
          />
        </div>
        <p className="text-xs text-ink-400 italic">
          {job?.state === 'active' ? 'Synthesizing data...' : 
           job?.state === 'waiting' ? 'Queued for processing...' :
           job?.state === 'completed' ? 'All results are ready.' :
           job?.state === 'failed' ? 'An error occurred during processing.' : 'Initializing...'}
        </p>
      </div>
    </div>
  );
}
