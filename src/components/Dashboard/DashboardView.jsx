import React, { useState, useEffect } from 'react';
import { HelpCircle, ArrowRight, Upload, Sparkles, AlertCircle, History, CheckCircle2, Target, BarChart2 } from 'lucide-react';
import { Card, StatusDot, CountUp, ProgressBar } from '../common/CommonUI';
import { storage } from '../../lib/storage';

export function DashboardView({ 
  activeProfile, 
  topics = [], 
  attempts = [], 
  topicsMasteryMap = {}, 
  readinessScore = 0, 
  quizSaveError = null,
  onStartQuiz, 
  onNavigateTab,
  onOpenManualScoreModal
}) {
  const [dbStats, setDbStats] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Load quiz history and mastery statistics directly from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    async function loadStorageStats() {
      try {
        const stats = await storage.getTopicMasteryStats(activeProfile?.subject);
        if (isMounted) {
          setDbStats(stats);
          setLoadError(null);
        }
      } catch (err) {
        console.error('Failed to load quiz statistics from storage:', err);
        if (isMounted) {
          setLoadError('Failed to load quiz data from local storage.');
        }
      }
    }
    loadStorageStats();
    return () => { isMounted = false; };
  }, [activeProfile?.subject, attempts.length]);

  // Derived topics: prefer dbStats if available, otherwise fallback to topicMasteryMap
  const hasDbHistory = dbStats && dbStats.history && dbStats.history.length > 0;
  const hasPropsAttempts = attempts && attempts.length > 0;
  const hasAnyData = hasDbHistory || hasPropsAttempts;

  const weakTopics = dbStats && dbStats.weakTopics && dbStats.weakTopics.length > 0
    ? dbStats.weakTopics
    : Object.values(topicsMasteryMap).filter(t => t.masteryScore < 60);

  const allTopicScores = dbStats && dbStats.topics && dbStats.topics.length > 0
    ? dbStats.topics
    : Object.values(topicsMasteryMap);

  const recentHistory = dbStats?.history ? dbStats.history.slice(0, 5) : [];

  const examDate = activeProfile?.examDate ? new Date(activeProfile.examDate) : new Date(Date.now() + 30 * 86400000);
  const daysLeft = Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-mono">
      {/* Visible Error Banner for saving or loading failures */}
      {(quizSaveError || loadError) && (
        <div className="p-4 border-2 border-black bg-[#ff2d2d]/10 text-black flex items-start gap-3 shadow-[4px_4px_0px_#000] animate-brutal-in">
          <AlertCircle className="w-5 h-5 text-[#ff2d2d] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold uppercase text-[#ff2d2d] text-xs">Storage Warning:</div>
            <div className="text-xs font-mono mt-0.5">{quizSaveError || loadError}</div>
          </div>
        </div>
      )}

      {/* 1. Welcome & Primary CTA */}
      <div className="space-y-4 pt-2 animate-brutal-in">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-display text-black tracking-wider leading-none">
            WELCOME BACK, <span className="text-[#ff2d2d] uppercase">{activeProfile?.name || "STUDENT"}</span>.
          </h1>
          <p className="text-xs sm:text-sm text-slate-800 font-bold uppercase pt-1 flex flex-wrap items-center gap-2">
            <span>{activeProfile?.subject || 'COURSE'}</span>
            <span>•</span>
            <span>EXAM IN <CountUp end={daysLeft} /> DAYS</span>
            <span>•</span>
            <span className="text-[#ff2d2d]">
              <CountUp end={readinessScore} suffix="%" /> READINESS SCORE
            </span>
          </p>
          <div className="pt-2 max-w-md">
            <ProgressBar value={readinessScore} />
          </div>
        </div>

        {/* ONE SIGNAL ACCENT BUTTON */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
          <button
            onClick={() => onStartQuiz('DIAGNOSTIC')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 neo-btn-accent text-sm py-3.5"
          >
            <HelpCircle className="w-5 h-5" />
            <span>START WITH A QUICK QUIZ</span>
          </button>

          <button
            onClick={onOpenManualScoreModal}
            className="neo-btn bg-white hover:bg-yellow-300 text-black py-3.5 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" /> UPLOAD PAST TEST SCORES
          </button>
        </div>
      </div>

      {/* 2. Top Weak Topics List & Topic Mastery */}
      <Card title="YOUR TOP WEAK TOPICS" className="delay-1">
        {!hasAnyData ? (
          <div className="text-center py-8 space-y-2 border-2 border-dashed border-black p-4 bg-[#f4f1ea]">
            <p className="text-sm font-bold text-black uppercase font-display">NO QUIZ DATA LOGGED YET</p>
            <p className="text-xs text-slate-700 max-w-sm mx-auto font-mono">
              Take your first 5-minute quiz to uncover which topics need revision.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {weakTopics.length === 0 ? (
              <p className="text-xs text-slate-700 font-bold uppercase py-2">
                GREAT JOB! ALL YOUR ATTEMPTED TOPICS CURRENTLY HAVE SOLID MASTERY SCORES.
              </p>
            ) : (
              weakTopics.slice(0, 4).map((t, idx) => (
                <div 
                  key={t.topicId || idx}
                  className={`flex items-center justify-between p-3.5 border-2 border-black bg-[#f4f1ea] shadow-[3px_3px_0px_#000] text-xs hover:translate-x-[2px] transition-transform delay-${idx + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <StatusDot status={t.status} />
                    <div>
                      <div className="font-bold text-black uppercase font-mono">{t.topicName}</div>
                      <div className="text-slate-700 text-[11px] font-mono">
                        <CountUp end={t.accuracyPct} suffix="%" /> ACCURACY • <CountUp end={t.totalAttempts} /> ATTEMPTS
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white bg-[#ff2d2d] border border-black px-2.5 py-0.5 text-[11px] uppercase">
                      <CountUp end={t.masteryScore} suffix="%" /> WEAK
                    </span>
                    <button
                      onClick={() => onStartQuiz('TOPIC', t.topicId)}
                      className="neo-btn px-3 py-1"
                    >
                      PRACTICE
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* 3. Per-Topic Scores Section */}
      {hasAnyData && allTopicScores.length > 0 && (
        <Card title="PER-TOPIC SCORES & MASTERY" className="delay-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allTopicScores.map((t, idx) => {
              const acc = t.accuracyPct !== undefined ? t.accuracyPct : t.masteryScore;
              return (
                <div 
                  key={t.topicId || idx}
                  className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000] flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-black uppercase truncate">{t.topicName}</div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      {t.totalAttempts || 1} ATTEMPTS LOGGED
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 font-bold border border-black text-[11px] ${
                      acc >= 75 ? 'bg-emerald-300 text-black' : acc >= 50 ? 'bg-yellow-300 text-black' : 'bg-red-200 text-red-900'
                    }`}>
                      {acc}%
                    </span>
                    <button
                      onClick={() => onStartQuiz('TOPIC', t.topicId)}
                      className="px-2 py-0.5 border border-black text-[10px] font-bold uppercase hover:bg-yellow-300"
                    >
                      QUIZ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 4. Recent Quiz History from Storage */}
      {recentHistory.length > 0 && (
        <Card title="RECENT QUIZ HISTORY" className="delay-2">
          <div className="space-y-2">
            {recentHistory.map((h) => {
              const dateStr = new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              const pct = h.total > 0 ? Math.round((h.score / h.total) * 100) : 0;
              return (
                <div 
                  key={h.id}
                  className="flex items-center justify-between p-3 border-2 border-black bg-[#f4f1ea] shadow-[2px_2px_0px_#000] text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-black uppercase">{h.topic}</div>
                    <div className="text-[10px] text-slate-600">{dateStr} • {h.difficulty} MODE</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black">
                      {h.score} / {h.total} ({pct}%)
                    </span>
                    <span className={`px-2 py-0.5 border border-black text-[10px] font-bold uppercase ${
                      pct >= 70 ? 'bg-emerald-300' : 'bg-yellow-300'
                    }`}>
                      {pct >= 70 ? 'PASS' : 'REVIEW'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 5. Next Step Banner */}
      <div className="p-5 border-2 border-black bg-yellow-300 shadow-[6px_6px_0px_#000] flex items-center justify-between animate-brutal-in delay-2">
        <div>
          <div className="text-xs font-display text-black uppercase">NEXT STEP</div>
          <div className="text-xs text-black font-mono">Take a 5-minute quiz to map your baseline learning gaps.</div>
        </div>

        <button
          onClick={() => onNavigateTab('quiz')}
          className="neo-btn bg-black text-white hover:bg-[#ff2d2d] hover:text-white flex items-center gap-2 py-2.5 px-4"
        >
          <span>TAKE A QUIZ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
