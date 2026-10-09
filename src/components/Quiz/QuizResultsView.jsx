import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, ArrowLeft, MessageSquare, Loader2 } from 'lucide-react';
import { Card, Badge } from '../common/CommonUI';
import { aiService } from '../../services/aiService';
import { AskDoubtModal } from './AskDoubtModal';

export function QuizResultsView({ results, onRetakeQuiz, onNavigateWeakTopics, onBackToDashboard, settings }) {
  const { questions, answers, timeSpent } = results;

  const total = questions.length;
  let correctCount = 0;
  let totalSecs = 0;

  questions.forEach(q => {
    const selected = answers[q.id];
    if (selected === q.correctAnswer) correctCount++;
    totalSecs += (timeSpent[q.id] || 20);
  });

  const accuracyPct = Math.round((correctCount / total) * 100);
  const avgSecsPerQ = Math.round(totalSecs / (total || 1));

  const [explanations, setExplanations] = useState({});
  const [doubtModalTopic, setDoubtModalTopic] = useState(null);

  const handleExplainDifferently = async (q, style) => {
    const qId = q.id;
    setExplanations(prev => ({
      ...prev,
      [qId]: { style, text: '', loading: true }
    }));

    try {
      const res = await aiService.explainDifferently({
        questionStem: q.stem,
        options: q.options,
        selectedAnswer: answers[qId],
        correctAnswer: q.correctAnswer,
        style,
        concept: q.concept,
        settings
      });

      setExplanations(prev => ({
        ...prev,
        [qId]: { style, text: res.text, mode: res.mode, loading: false }
      }));
    } catch (err) {
      console.error('Failed to generate alternative explanation:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Quiz Score Summary Banner */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge variant={accuracyPct >= 75 ? 'success' : (accuracyPct >= 50 ? 'warning' : 'danger')}>
            {accuracyPct >= 75 ? 'Strong Performance' : 'Practice Recommended'}
          </Badge>
          <h2 className="text-2xl font-serif font-bold text-[#2c2825]">
            Score: {accuracyPct}% ({correctCount} / {total} correct)
          </h2>
          <p className="text-xs text-[#6b6259]">
            Time spent: {Math.floor(totalSecs / 60)}m {totalSecs % 60}s (avg {avgSecsPerQ}s per question)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="neo-btn bg-white hover:bg-yellow-300 text-black px-3.5 py-2 font-bold text-xs inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" /> ← BACK TO DASHBOARD
            </button>
          )}
          <button
            onClick={onRetakeQuiz}
            className="neo-btn bg-white hover:bg-yellow-300 text-black px-3.5 py-2 font-bold text-xs inline-flex items-center gap-1.5 min-h-[40px]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
          </button>
          <button
            onClick={onNavigateWeakTopics}
            className="neo-btn-accent px-4 py-2 text-xs font-bold min-h-[40px]"
          >
            See Weak Topics
          </button>
        </div>
      </Card>

      {/* Questions Review */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-lg text-[#2c2825]">Question Review</h3>

        {questions.map((q, idx) => {
          const selectedIdx = answers[q.id];
          const isCorrect = selectedIdx === q.correctAnswer;
          const customExp = explanations[q.id];

          return (
            <Card key={q.id} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#f0eadf] text-xs">
                <span className="font-serif font-bold text-[#2c2825] text-sm">
                  Question {idx + 1} • {q.topicName}
                </span>
                <span className={`font-bold flex items-center gap-1 ${isCorrect ? 'text-[#4a6350]' : 'text-[#9c4135]'}`}>
                  {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <p className="font-serif font-bold text-base text-[#2c2825]">{q.stem}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options?.map((opt, optIdx) => {
                  const isSelectedOpt = selectedIdx === optIdx;
                  const isCorrectOpt = q.correctAnswer === optIdx;

                  let style = 'bg-[#fbf9f5] border-[#e5ddd0] text-[#4a443f]';
                  if (isCorrectOpt) style = 'bg-[#f2f6f3] border-[#d4e0d7] text-[#4a6350] font-bold';
                  else if (isSelectedOpt && !isCorrectOpt) style = 'bg-[#fdf3f2] border-[#f4d7d4] text-[#9c4135] font-bold';

                  return (
                    <div key={optIdx} className={`p-3 rounded-xl border flex items-center justify-between ${style}`}>
                      <span>{opt}</span>
                      {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-[#5a7361]" />}
                    </div>
                  );
                })}
              </div>

              {/* Standard Explanation */}
              <div className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#e5ddd0] text-xs space-y-1 text-[#2c2825]">
                <div className="font-serif font-bold text-[#2c2825] text-sm">Explanation:</div>
                <p>{q.explanation}</p>
              </div>

              {/* Regenerated Explanation Box */}
              {customExp && (
                <div className="p-3.5 rounded-xl bg-[#f5eeea] border border-[#e2d5cb] text-xs space-y-1 text-[#4a3f35]">
                  <div className="font-serif font-bold uppercase tracking-wider text-[10px] text-[#785b48]">
                    Alternative Explanation ({customExp.style})
                  </div>
                  {customExp.loading ? (
                    <div className="flex items-center gap-2 text-[#785b48] font-semibold py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating in {customExp.style} style...
                    </div>
                  ) : (
                    <p className="whitespace-pre-line leading-relaxed">{customExp.text}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#8c827a] font-semibold">Explain differently:</span>
                  {['simple', 'step-by-step', 'analogy'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleExplainDifferently(q, st)}
                      className="px-2.5 py-1 rounded-full bg-[#f4efe6] hover:bg-[#eae3d8] text-[#2c2825] text-[11px] font-semibold capitalize transition-colors"
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setDoubtModalTopic(q.topicName)}
                  className="text-xs font-bold text-[#8c6d58] hover:underline flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Ask a doubt
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Next Step Banner */}
      <div className="p-5 rounded-2xl border border-[#e5ddd0] bg-white flex items-center justify-between shadow-[0_4px_20px_rgba(44,40,37,0.02)]">
        <div>
          <div className="text-xs font-serif font-bold text-[#2c2825] text-sm">Next Step</div>
          <div className="text-xs text-[#6b6259]">View your updated weak topics list.</div>
        </div>

        <button
          onClick={onNavigateWeakTopics}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2c2825] hover:bg-[#1a1816] text-white font-bold text-xs transition-colors"
        >
          <span>See Your Weak Topics</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Ask Doubt Modal */}
      {doubtModalTopic && (
        <AskDoubtModal
          isOpen={true}
          onClose={() => setDoubtModalTopic(null)}
          topicName={doubtModalTopic}
          weakConcepts={[]}
          settings={settings}
        />
      )}
    </div>
  );
}
