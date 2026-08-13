import { Suspense } from 'react';
import AssignmentClient from './AssignmentClient';

export function generateStaticParams() {
  return [{ id: 'active' }];
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading assignment...</div>}>
      <AssignmentClient params={params} />
    </Suspense>
  );
}
