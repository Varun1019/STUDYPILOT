import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal } from '../common/CommonUI';

export function QuizSetupModal({ isOpen, onClose, topics, onLaunchQuiz, initialMode = 'MIXED', initialTopicId = null }) {
  const [mode, setMode] = useState(initialMode);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId || (topics[0]?.id || ''));
  const [count, setCount] = useState(10);
  const [timerMins, setTimerMins] = useState(10);
  const [adaptive, setAdaptive] = useState(true);

  const handleLaunch = () => {
    onLaunchQuiz({
      mode,
      topicId: mode === 'TOPIC' ? selectedTopicId : null,
      count: Number(count),
      timerMins: Number(timerMins),
      adaptive
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Quiz" maxWidth="max-w-md">
      <div className="space-y-4 py-1">
        {/* Mode Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-serif font-bold text-[#2c2825]">Quiz Target</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'DIAGNOSTIC', title: 'Diagnostic Test', desc: '10 questions across topics' },
              { id: 'WEAK_ONLY', title: 'Weak Topics Only', desc: 'Target weak topics <50%' },
              { id: 'MIXED', title: 'Mixed Topics', desc: 'Randomized quiz' },
              { id: 'TOPIC', title: 'Single Topic', desc: 'Focus on 1 topic' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                  mode === m.id
                    ? 'bg-[#f5eeea] border-[#8c6d58] text-[#2c2825] font-bold'
                    : 'bg-white border-[#e5ddd0] hover:bg-[#f4efe6] text-[#6b6259]'
                }`}
              >
                <div className="font-serif font-bold text-[#2c2825] text-sm">{m.title}</div>
                <div className="text-[10px] text-[#8c827a] font-sans font-normal">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {mode === 'TOPIC' && (
          <div className="space-y-1">
            <label className="block text-xs font-serif font-bold text-[#2c2825]">Select Topic</label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#e2dacd] bg-[#fbf9f5] text-xs font-semibold text-[#2c2825]"
            >
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 font-sans">
          <div>
            <label className="block text-xs font-bold text-[#2c2825] mb-1">Questions</label>
            <select
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#e2dacd] bg-[#fbf9f5] text-xs font-semibold text-[#2c2825]"
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2c2825] mb-1">Timer</label>
            <select
              value={timerMins}
              onChange={(e) => setTimerMins(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#e2dacd] bg-[#fbf9f5] text-xs font-semibold text-[#2c2825]"
            >
              <option value={0}>No Timer</option>
              <option value={5}>5 Minutes</option>
              <option value={10}>10 Minutes</option>
            </select>
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end pt-3">
          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl wabi-btn-primary font-bold text-xs shadow-xs"
          >
            Start Quiz Now
          </button>
        </div>
      </div>
    </Modal>
  );
}
