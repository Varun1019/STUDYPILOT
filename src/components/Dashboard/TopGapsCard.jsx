import React from 'react';
import { AlertTriangle, ArrowRight, BookOpen, BrainCircuit, Sparkles } from 'lucide-react';
import { Badge } from '../common/CommonUI';

export function TopGapsCard({ topicsMasteryMap, onStartQuizForTopic, onGenerateNotesForTopic }) {
  // Sort topics by mastery score ascending (lowest mastery first)
  const weakTopics = Object.values(topicsMasteryMap)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  if (weakTopics.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        No learning gaps detected yet. Take a quiz to analyze topic mastery.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weakTopics.map((item, idx) => (
        <div 
          key={item.topicId}
          className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:border-rose-300 dark:hover:border-rose-800"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] flex items-center justify-center">
                #{idx + 1}
              </span>
              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                {item.topicName}
              </h5>
              <Badge variant={item.masteryScore < 50 ? 'danger' : 'warning'}>
                {item.masteryScore}% Mastery ({item.status})
              </Badge>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Accuracy: <span className="font-bold text-slate-700 dark:text-slate-300">{item.accuracyPct}%</span> • 
              Attempts: <span className="font-bold text-slate-700 dark:text-slate-300">{item.totalAttempts}</span> • 
              Avg time: <span className="font-bold text-slate-700 dark:text-slate-300">{item.avgTimeSec}s</span>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onStartQuizForTopic(item.topicId)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <BrainCircuit className="w-3.5 h-3.5" /> Practice
            </button>
            <button
              onClick={() => onGenerateNotesForTopic(item.topicId)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Notes
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
