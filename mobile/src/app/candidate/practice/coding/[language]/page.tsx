import { Suspense } from 'react';
import LanguageClient from './LanguageClient';

export function generateStaticParams() {
  return [
    { language: 'java' },
    { language: 'python' },
    { language: 'c' },
    { language: 'c++' },
    { language: 'javascript' },
    { language: 'typescript' },
    { language: 'go' },
    { language: 'rust' },
    { language: 'kotlin' },
    { language: 'swift' },
    { language: 'php' },
    { language: 'ruby' },
    { language: 'c#' },
    { language: 'dart' },
    { language: 'r' },
    { language: 'matlab' },
    { language: 'sql' },
    { language: 'bash' },
    { language: 'scala' },
    { language: 'objective-c' },
    { language: 'haskell' },
    { language: 'perl' },
    { language: 'julia' },
  ];
}

export default function Page({ params }: { params: { language: string } }) {
  return (
    <Suspense fallback={<div>Loading IDE...</div>}>
      <LanguageClient params={params} />
    </Suspense>
  );
}
