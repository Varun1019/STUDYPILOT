import React, { useState } from 'react';
import { Target, HelpCircle, ArrowRight } from 'lucide-react';
import { Card, StatusDot, Modal } from '../common/CommonUI';

export function GapAnalysisView({ topicsMasteryMap, onStartQuizForTopic, onNavigateTab }) {
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const topicList = Object.values(topicsMasteryMap);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-mono">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-black">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-black">YOUR WEAK TOPICS</h1>
          <p className="text-xs text-slate-700 mt-0.5 font-bold uppercase">
            TOPICS ORGANIZED BY QUIZ ACCURACY AND RESPONSE SPEED.
          </p>
        </div>

        <button
          onClick={() => setShowFormulaModal(true)}
          className="text-xs text-black hover:text-[#ff2d2d] flex items-center gap-1 font-bold underline"
        >
          <HelpCircle className="w-3.5 h-3.5" /> HOW IS THIS CALCULATED?
        </button>
      </div>

      {/* Simple List of Topics */}
      <Card>
        {topicList.length === 0 ? (
          <div className="text-center py-8 space-y-2 border-2 border-dashed border-black p-4 bg-[#f4f1ea]">
            <p className="text-sm font-display text-black">NO TOPICS ADDED YET</p>
            <p className="text-xs text-slate-700">Take your first quiz to uncover your weak topics.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black">
            {topicList.map((t) => {
              let label = 'Weak';
              if (t.masteryScore >= 75) label = 'Strong';
              else if (t.masteryScore >= 50) label = 'Okay';

              return (
                <div key={t.topicId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StatusDot status={label} />
                    <div>
                      <div className="font-display text-black text-sm uppercase">{t.topicName}</div>
                      <div className="text-xs text-slate-700 font-mono">
                        {t.accuracyPct}% ACCURACY • {t.totalAttempts} ATTEMPTS • AVG {t.avgTimeSec}S/QUESTION
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className={`text-xs font-bold px-3 py-1 rounded-none border border-black uppercase ${
                      label === 'Weak' ? 'bg-[#ff2d2d] text-white' : (
                        label === 'Okay' ? 'bg-amber-300 text-black' : 'bg-emerald-300 text-black'
                      )
                    }`}>
                      {t.masteryScore}% ({label})
                    </span>

                    <button
                      onClick={() => onStartQuizForTopic(t.topicId)}
                      className="neo-btn px-4 py-1.5"
                    >
                      PRACTICE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Next Step Banner */}
      <div className="p-5 border-2 border-black bg-yellow-300 shadow-[6px_6px_0px_#000] flex items-center justify-between">
        <div>
          <div className="text-xs font-display text-black">NEXT STEP</div>
          <div className="text-xs text-black font-mono">Read short notes and practice cards for your weak topics.</div>
        </div>

        <button
          onClick={() => onNavigateTab('study')}
          className="neo-btn bg-black text-white hover:bg-[#ff2d2d] hover:text-white flex items-center gap-2 py-2.5 px-4"
        >
          <span>STUDY NOTES & CARDS</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calculation Formula Modal */}
      <Modal isOpen={showFormulaModal} onClose={() => setShowFormulaModal(false)} title="HOW WEAK TOPICS ARE CALCULATED">
        <div className="space-y-3 text-xs text-black leading-relaxed font-mono">
          <p className="font-bold">
            STUDYPILOT COMPUTES TOPIC STRENGTH (0-100%) USING A SIMPLE WEIGHTED FORMULA:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>ACCURACY:</strong> % OF QUESTIONS ANSWERED CORRECTLY.</li>
            <li><strong>DIFFICULTY:</strong> HARD QUESTIONS CARRY 1.35X WEIGHT; EASY CARRY 0.75X.</li>
            <li><strong>RECENCY:</strong> RECENT ATTEMPTS WEIGH MORE THAN OLDER ATTEMPTS.</li>
            <li><strong>SPEED:</strong> FAST WRONG ANSWERS (&lt;15S) PENALIZE MASTERY AS CARELESS ERRORS.</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
