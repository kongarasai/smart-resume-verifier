'use client';
import { Clock, CheckCircle, Star, Shield, MessageSquare, Briefcase, ChevronDown, ChevronRight, Ban, XCircle, PauseCircle } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const EVENT_ICONS: Record<string, any> = {
  practice_attempt: CheckCircle,
  practice_completed: CheckCircle,
  question_starred: Star,
  hr_review: Briefcase,
  shortlisted: Star,
  blocked: Ban,
  rejected: XCircle,
  hold: PauseCircle,
  teacher_feedback: MessageSquare,
  verification: Shield,
};

const EVENT_COLORS: Record<string, string> = {
  practice_attempt: 'text-green-600 bg-green-50',
  practice_completed: 'text-green-600 bg-green-50',
  question_starred: 'text-amber-600 bg-amber-50',
  hr_review: 'text-blue-600 bg-blue-50',
  shortlisted: 'text-purple-600 bg-purple-50 border-purple-100',
  blocked: 'text-red-600 bg-red-50 border-red-100',
  rejected: 'text-gray-600 bg-gray-50 border-gray-100',
  hold: 'text-orange-600 bg-orange-50 border-orange-100',
  teacher_feedback: 'text-purple-600 bg-purple-50',
  verification: 'text-signal-blue bg-signal-blue/10',
};

export function ProgressTimeline({ events }: { events: any[] }) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-10 bg-ink-25 rounded-xl border border-ink-100">
        <Clock size={24} className="mx-auto text-ink-300 mb-2" />
        <p className="text-sm text-ink-500">No activity yet. Start practicing to see your progress!</p>
      </div>
    );
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Grouping logic
  const groups: { label: string; type: 'day' | 'month'; events: any[] }[] = [];
  
  events.forEach(ev => {
    const d = new Date(ev.created_at);
    const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    
    let label: string;
    let type: 'day' | 'month';
    
    if (isCurrentMonth) {
      label = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const today = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      if (label === today) label = 'Today';
      type = 'day';
    } else {
      label = d.toLocaleDateString([], { month: 'long', year: 'numeric' });
      type = 'month';
    }

    const existing = groups.find(g => g.label === label);
    if (existing) {
      existing.events.push(ev);
    } else {
      groups.push({ label, type, events: [ev] });
    }
  });

  return (
    <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-ink-100">
      {groups.map((group, gIdx) => {
        const isExpanded = expandedGroups[group.label] !== false; // Default expanded for day groups in current month
        const isMonth = group.type === 'month';
        const displayExpanded = isMonth ? expandedGroups[group.label] : isExpanded;

        return (
          <div key={group.label} className="relative pl-10">
            {/* Group Header */}
            <div className="absolute left-0 top-0 w-9 h-9 flex items-center justify-center z-20">
               <div className="w-2.5 h-2.5 rounded-full bg-ink-300 border-[3px] border-white shadow-sm" />
            </div>
            <div className="mb-4 flex items-center gap-2 cursor-pointer group/header" onClick={() => toggleGroup(group.label)}>
               <span className={clsx(
                 "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors",
                 displayExpanded ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-400 group-hover/header:bg-ink-200"
               )}>
                 {group.label}
               </span>
               {displayExpanded ? <ChevronDown size={12} className="text-ink-300" /> : <ChevronRight size={12} className="text-ink-300" />}
            </div>

            {displayExpanded && (
              <div className="space-y-3 animate-slide-up">
                {group.events.map((event, idx) => {
                  const Icon = EVENT_ICONS[event.event_type] || Clock;
                  const colorClass = EVENT_COLORS[event.event_type] || 'text-ink-500 bg-ink-50';
                  const isHiringEvent = ['shortlisted', 'blocked', 'rejected', 'hold'].includes(event.event_type);

                  return (
                    <div key={event.id || `${gIdx}-${idx}`} 
                         className={clsx(
                           "bg-white rounded-xl border transition-all hover:shadow-sm",
                           isHiringEvent ? "border-ink-900 ring-1 ring-ink-900 ring-offset-2" : "border-ink-100",
                           isMonth ? "p-3 flex items-center gap-3" : "p-4"
                         )}>
                      
                      {isMonth ? (
                        <>
                          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center shrink-0', colorClass)}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                               <h4 className={clsx("text-xs font-semibold truncate", isHiringEvent ? "text-ink-900" : "text-ink-900")}>{event.event_title}</h4>
                               <span className="text-[9px] text-ink-400">{new Date(event.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                            </div>
                            {event.points_gained > 0 && (
                              <div className="text-[9px] font-bold text-green-600">+{event.points_gained} PTS</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                               <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center', colorClass)}>
                                  <Icon size={12} />
                               </div>
                               <h4 className="font-display text-sm text-ink-900 font-semibold">{event.event_title}</h4>
                            </div>
                            <span className="text-[9px] text-ink-400 font-medium">
                              {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-ink-600 leading-relaxed ml-8">{event.event_detail}</p>
                          {event.points_gained > 0 && (
                            <div className="ml-8 mt-2">
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                +{event.points_gained} PTS
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
