import React from 'react';
import { Zap, Clock, AlertCircle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/CommonUI';

export function ErrorPatternCard({ patterns }) {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        No error patterns detected. Complete more quiz attempts to analyze behavior!
      </div>
    );
  }

  const getIcon = (type) => {
    if (type === 'CARELESS') return <Zap className="w-4 h-4 text-amber-500" />;
    if (type === 'CONCEPT_GAP') return <Clock className="w-4 h-4 text-rose-500" />;
    return <AlertCircle className="w-4 h-4 text-purple-500" />;
  };

  return (
    <div className="space-y-3">
      {patterns.map((p) => (
        <div 
          key={p.id}
          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getIcon(p.type)}
              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                {p.title}
              </h5>
            </div>
            <Badge variant={p.severity === 'HIGH' ? 'danger' : (p.severity === 'MEDIUM' ? 'warning' : 'success')}>
              {p.percentage}% of Errors
            </Badge>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {p.description}
          </p>

          <div className="flex items-start gap-1.5 p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 text-[11px] font-medium border border-indigo-100 dark:border-indigo-900/40">
            <Lightbulb className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <span><strong>Recommendation:</strong> {p.recommendation}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
