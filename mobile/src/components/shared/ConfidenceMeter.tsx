'use client';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import clsx from 'clsx';

interface ScoreProps {
  score: any;
  compact?: boolean;
}

const LABEL_CONFIG: Record<string, { icon: any; class: string; label: string }> = {
  high: { icon: ShieldCheck, class: 'confidence-high', label: 'High Confidence' },
  medium: { icon: ShieldAlert, class: 'confidence-medium', label: 'Medium Confidence' },
  limited: { icon: ShieldQuestion, class: 'confidence-limited', label: 'Limited Evidence' },
};

export function ConfidenceMeter({ score, compact }: ScoreProps) {
  if (!score) return <div className="text-sm text-ink-400 italic">Not calculated yet</div>;

  const cfg = LABEL_CONFIG[score.confidence_label] || LABEL_CONFIG.limited;
  const Icon = cfg.icon;

  const bars = [
    { label: 'Coding (50%)', value: score.coding_test_score ?? score.practice_score ?? 0, color: '#d4820a' },
    { label: 'GitHub (30%)', value: score.github_score ?? 0, color: '#1a6fa8' },
    { label: 'Skills (20%)', value: score.skill_match_score ?? score.profile_completeness_score ?? 0, color: '#2d9e5f' },
  ];

  const overallScore = score.overall_score ?? 0;
  const barBg = overallScore >= 70 ? '#2d9e5f' : overallScore >= 40 ? '#d4820a' : '#c0392b';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={clsx('badge', cfg.class)}>
          <Icon size={11} />
          {cfg.label}
        </div>
        <span className="font-mono text-sm font-medium">{overallScore}/100</span>
      </div>
    );
  }

  return (
    <div className="card p-6 border-2 border-indigo-50 shadow-sm relative overflow-hidden">
      <div className="absolute -right-10 -top-10 text-indigo-50 opacity-50 pointer-events-none">
        <ShieldCheck size={140} />
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wide mb-1">
            Final Verification Score
          </div>
          <div className={clsx('flex items-center gap-2 badge px-3 py-1.5 text-sm', cfg.class)}>
            <Icon size={14} />
            {cfg.label}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-5xl font-bold text-ink-900 drop-shadow-sm">{overallScore}</div>
          <div className="text-xs text-ink-500 font-mono">/100</div>
        </div>
      </div>

      {/* AI Fraud Risk Metric */}
      {score.fraud_probability !== undefined && (
        <div className="mb-6 p-4 rounded-xl bg-ink-950 flex flex-col shadow-inner">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse block"></span>
                AI Fraud Detection
              </div>

            </div>
            <div className="text-right">
              <div className={clsx('text-2xl font-display mt-1',
                score.fraud_probability > 0.65 ? 'text-red-400' :
                score.fraud_probability < 0.35 ? 'text-green-400' : 'text-amber-400'
              )}>
                {Math.round(score.fraud_probability * 100)}% Risk
              </div>
            </div>
          </div>
          {score.fraud_reasons && score.fraud_reasons.length > 0 && (
             <div className="mt-3 pt-3 border-t border-ink-800">
               <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Risk Factors Detected</span>
               <ul className="mt-2 space-y-1">
                 {score.fraud_reasons.map((r: string, i: number) => (
                   <li key={i} className="text-xs text-ink-300 flex items-start gap-1.5">
                     <span className="text-amber-500 mt-0.5">•</span> {r}
                   </li>
                 ))}
               </ul>
             </div>
          )}
        </div>
      )}

      {/* Overall progress bar */}
      <div className="h-3 rounded-full bg-ink-100 overflow-hidden mb-6">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${overallScore}%`, background: barBg }}
        />
      </div>

      {/* Sub-score breakdown */}
      <div className="space-y-4">
        {bars.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-4">
            <div className="text-xs font-semibold text-ink-700 w-24 shrink-0">{label}</div>
            <div className="flex-1 h-2 rounded bg-ink-100 overflow-hidden">
              <div
                className="h-full rounded transition-all duration-1000 ease-in-out"
                style={{ width: `${value}%`, background: color }}
              />
            </div>
            <div className="font-mono text-xs font-bold text-ink-900 w-8 text-right">{value}</div>
          </div>
        ))}
      </div>

      {/* Skill gaps */}
      {score.skill_gaps?.length > 0 && (
        <div className="mt-5 pt-5 border-t border-ink-100">
          <div className="text-xs text-ink-500 mb-2 uppercase tracking-wide">Skill Gaps</div>
          <div className="flex flex-wrap gap-1.5">
            {score.skill_gaps.map((s: string) => (
              <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  const cfg = ({
    low: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
    unknown: 'bg-ink-100 text-ink-500 border-ink-200',
  } as Record<string, string>)[risk] || 'bg-ink-100 text-ink-500 border-ink-200';

  return (
    <span className={`badge ${cfg}`}>
      {risk?.toUpperCase() ?? 'UNKNOWN'} RISK
    </span>
  );
}
