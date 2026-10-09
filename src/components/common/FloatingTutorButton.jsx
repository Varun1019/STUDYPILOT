import React, { useState } from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import { AiTutorAgent } from '../Progress/AiTutorAgent';

export function FloatingTutorButton({ 
  activeProfile, 
  readinessScore = 0, 
  topicsMasteryMap = {}, 
  flashcards = [], 
  notes = [], 
  settings,
  onNavigateTab
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <aside 
        aria-label="AI Tutor Assistant"
        className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-none border-3 border-black text-xs font-display uppercase tracking-wider transition-all duration-200 min-h-[48px] shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] ${
            isOpen 
              ? 'bg-black text-white hover:bg-neutral-800' 
              : 'bg-yellow-300 hover:bg-yellow-400 text-black hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000]'
          }`}
          title="Open AI Tutor Agent"
          aria-label="Toggle AI Tutor"
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5 text-white" />
              <span>CLOSE TUTOR</span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 bg-[#ff2d2d] text-white flex items-center justify-center border border-black shadow-[1px_1px_0px_#000]">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold">ASK AI TUTOR</span>
              <span className="w-2 h-2 rounded-full bg-[#ff2d2d] animate-ping" />
            </>
          )}
        </button>
      </aside>

      {/* Floating Drawer / Modal Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-2 sm:p-6 bg-black/60 animate-brutal-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-2xl bg-white border-3 border-black shadow-[10px_10px_0px_#000] z-10 max-h-[90vh] overflow-hidden flex flex-col font-mono">
            {/* Top Close Bar */}
            <div className="bg-black text-white px-4 py-2 flex items-center justify-between border-b-2 border-black">
              <div className="flex items-center gap-2 text-xs font-display">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>AI STUDY AGENT // {activeProfile?.subject?.toUpperCase() || 'GENERAL'}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#ff2d2d] text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Tutor Agent Component */}
            <div className="overflow-y-auto flex-1">
              <AiTutorAgent
                activeProfile={activeProfile}
                readinessScore={readinessScore}
                topicsMasteryMap={topicsMasteryMap}
                flashcards={flashcards}
                notes={notes}
                settings={settings}
                onNavigateTab={(tab) => {
                  setIsOpen(false);
                  if (onNavigateTab) onNavigateTab(tab);
                }}
                onGoBack={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
