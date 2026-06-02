import { Suspense } from 'react';
import LanguageClient from './LanguageClient';

export function generateStaticParams() {
  return [
    { language: 'python' },
    { language: 'javascript' },
    { language: 'java' },
    { language: 'cpp' }
  ];
}

export default function Page({ params }: { params: { language: string } }) {
  return (
    <Suspense fallback={<div>Loading IDE...</div>}>
      <LanguageClient params={params} />
    </Suspense>
  );
}
