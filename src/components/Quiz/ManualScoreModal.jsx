import React, { useState } from 'react';
import { Upload, Plus, Check, FileText } from 'lucide-react';
import { Modal } from '../common/CommonUI';

export function ManualScoreModal({ isOpen, onClose, topics, onSaveManualAttempts }) {
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id || '');
  const [correctCount, setCorrectCount] = useState(7);
  const [totalCount, setTotalCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Medium');
  const [csvText, setCsvText] = useState('');
  const [tab, setTab] = useState('form'); // 'form' | 'csv'

  const handleSaveForm = () => {
    const topic = topics.find(t => t.id === selectedTopicId) || topics[0];
    if (!topic) return;

    const attempts = [];
    const correctNum = Math.min(Number(correctCount), Number(totalCount));
    const totalNum = Number(totalCount);

    for (let i = 0; i < totalNum; i++) {
      attempts.push({
        id: `man-att-${Date.now()}-${i}`,
        questionId: `manual-q-${Date.now()}-${i}`,
        topicId: topic.id,
        topicName: topic.name,
        concept: 'Manual Uploaded Score',
        difficulty,
        selected: i < correctNum ? 0 : 1,
        correct: i < correctNum,
        timeTaken: 25,
        timestamp: Date.now() - Math.floor(Math.random() * 3) * 86400000
      });
    }

    onSaveManualAttempts(attempts);
    onClose();
  };

  const handleSaveCSV = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const attempts = [];

    lines.forEach((line, idx) => {
      // Format: topicName, correctCount, totalCount, difficulty
      const parts = line.split(',').map(s => s.trim());
      if (parts.length >= 3) {
        const [tName, cCount, tCount, diff] = parts;
        const matchedTopic = topics.find(t => t.name.toLowerCase().includes(tName.toLowerCase())) || topics[0];
        
        const cNum = Number(cCount) || 0;
        const totNum = Number(tCount) || 10;
        const dLevel = diff || 'Medium';

        for (let i = 0; i < totNum; i++) {
          attempts.push({
            id: `csv-att-${Date.now()}-${idx}-${i}`,
            questionId: `csv-q-${Date.now()}-${idx}-${i}`,
            topicId: matchedTopic?.id || 'top-1',
            topicName: matchedTopic?.name || tName,
            concept: 'CSV Imported Score',
            difficulty: dLevel,
            selected: i < cNum ? 0 : 1,
            correct: i < cNum,
            timeTaken: 25,
            timestamp: Date.now()
          });
        }
      }
    });

    if (attempts.length > 0) {
      onSaveManualAttempts(attempts);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Score Entry & CSV Import" maxWidth="max-w-lg">
      <div className="space-y-4 py-2">
        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setTab('form')}
            className={`py-2 px-4 border-b-2 transition-colors ${tab === 'form' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Form Entry
          </button>
          <button
            onClick={() => setTab('csv')}
            className={`py-2 px-4 border-b-2 transition-colors ${tab === 'csv' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            CSV Paste Import
          </button>
        </div>

        {tab === 'form' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Topic Name
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correct Score
                </label>
                <input
                  type="number"
                  value={correctCount}
                  onChange={(e) => setCorrectCount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Questions
                </label>
                <input
                  type="number"
                  value={totalCount}
                  onChange={(e) => setTotalCount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveForm}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
              >
                Log Score Entry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste CSV rows formatted as: <code>Topic Name, CorrectCount, TotalCount, Difficulty</code>
            </p>

            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Arrays & Sliding Window, 8, 10, Medium&#10;Dynamic Programming, 4, 10, Hard"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveCSV}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
              >
                Import CSV Entries
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
