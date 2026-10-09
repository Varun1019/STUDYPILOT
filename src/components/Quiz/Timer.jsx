import React, { useState, useEffect } from 'react';
import { Clock, Pause, Play } from 'lucide-react';

export function Timer({ totalMinutes, onTimeUp, onPauseChange }) {
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, isPaused, onTimeUp]);

  const togglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    if (onPauseChange) onPauseChange(next);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isWarning = secondsLeft < 60;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs transition-colors ${
      isWarning 
        ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse' 
        : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
    }`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
      <button 
        onClick={togglePause}
        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        title={isPaused ? "Resume Timer" : "Pause Timer"}
      >
        {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
      </button>
    </div>
  );
}
