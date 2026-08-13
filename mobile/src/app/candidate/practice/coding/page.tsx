'use client';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { ChevronLeft } from 'lucide-react';

const LANGUAGES = [
  { id: 'Java', name: 'Java', color: 'border-orange-500', group: 'Enterprise' },
  { id: 'Python', name: 'Python', color: 'border-blue-500', group: 'Data/AI' },
  { id: 'C', name: 'C', color: 'border-indigo-600', group: 'Systems' },
  { id: 'C++', name: 'C++', color: 'border-blue-600', group: 'Systems' },
  { id: 'JavaScript', name: 'JavaScript', color: 'border-yellow-400', group: 'Web' },
  { id: 'TypeScript', name: 'TypeScript', color: 'border-blue-400', group: 'Web' },
  { id: 'Go', name: 'Go', color: 'border-cyan-500', group: 'Backend' },
  { id: 'Rust', name: 'Rust', color: 'border-orange-700', group: 'Systems' },
  { id: 'Kotlin', name: 'Kotlin', color: 'border-purple-500', group: 'Mobile/Backend' },
  { id: 'Swift', name: 'Swift', color: 'border-orange-600', group: 'Mobile' },
  { id: 'PHP', name: 'PHP', color: 'border-indigo-400', group: 'Backend' },
  { id: 'Ruby', name: 'Ruby', color: 'border-red-600', group: 'Backend' },
  { id: 'C#', name: 'C#', color: 'border-green-600', group: 'Enterprise' },
  { id: 'Dart', name: 'Dart', color: 'border-teal-400', group: 'Mobile' },
  { id: 'R', name: 'R', color: 'border-blue-700', group: 'Data' },
  { id: 'MATLAB', name: 'MATLAB', color: 'border-yellow-600', group: 'Math' },
  { id: 'SQL', name: 'SQL', color: 'border-stone-500', group: 'Database' },
  { id: 'Bash', name: 'Bash', color: 'border-gray-800', group: 'Scripting' },
  { id: 'Scala', name: 'Scala', color: 'border-red-500', group: 'Enterprise' },
  { id: 'Objective-C', name: 'Objective-C', color: 'border-blue-900', group: 'Mobile' },
  { id: 'Haskell', name: 'Haskell', color: 'border-purple-600', group: 'Functional' },
  { id: 'Perl', name: 'Perl', color: 'border-blue-300', group: 'Scripting' },
  { id: 'Julia', name: 'Julia', color: 'border-indigo-500', group: 'Data' },
];

export default function LanguageSelectionPage() {
  const router = useRouter();

  const handleSelect = (lang: string) => {
    router.push('/candidate/practice/coding/' + lang.toLowerCase());
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto animate-fade-in pb-16">
        <button
          onClick={() => router.push('/candidate/practice')}
          className="flex items-center text-sm font-medium text-ink-500 hover:text-ink-900 mb-6 transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Practice Selection
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-display text-ink-900 mb-2">Language Practice Module</h1>
          <p className="text-ink-500 text-lg">
            Choose from 23 supported languages. Each features comprehensive coding challenges
            in an anti-cheat monitored environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => handleSelect(lang.id)}
              className={
                'relative overflow-hidden group bg-white border border-ink-200 rounded-xl p-5 text-left ' +
                'shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 active:scale-[0.98] ' +
                lang.color + ' border-l-4'
              }
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="font-display text-xl text-ink-900 mb-1">{lang.name}</h3>
              <p className="text-xs text-ink-500 font-mono uppercase tracking-wider">{lang.group}</p>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
