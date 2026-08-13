'use client';
import { Suspense } from 'react';
import CandidateClient from '@/components/shared/CandidateClient';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function NeutralProfilePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-ink-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <CandidateClient />
      </Suspense>
    </DashboardLayout>
  );
}
