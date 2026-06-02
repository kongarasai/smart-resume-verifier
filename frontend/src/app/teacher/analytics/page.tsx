import { Suspense } from 'react';
import AnalyticsClient from './AnalyticsClient';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function AnalyticsPage() {
  return (
    <DashboardLayout requiredRole="teacher">
      <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>}>
        <AnalyticsClient />
      </Suspense>
    </DashboardLayout>
  );
}
