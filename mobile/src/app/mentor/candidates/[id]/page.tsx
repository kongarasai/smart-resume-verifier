import { Suspense } from 'react';
import CandidateClient from '@/components/shared/CandidateClient';
import DashboardLayout from '@/components/shared/DashboardLayout';

export function generateStaticParams() {
  return [{ id: 'view' }];
}

export default function Page() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <CandidateClient />
      </Suspense>
    </DashboardLayout>
  );
}
