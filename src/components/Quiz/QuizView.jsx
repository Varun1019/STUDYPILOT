import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Bookmark, Sparkles } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { Timer } from './Timer';
import { Badge } from '../common/CommonUI';

export function QuizView({ quizSession, onFinishQuiz, onQuitQuiz }) {
  const [questions, setQuestions] = useState(quizSession.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [answers, setAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState({});
  const [flagged, setFlagged] = useState(new Set());

  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState(questions[0]?.difficulty || 'Medium');

  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optionIndex) => {
    const qId = currentQ.id;
    const elapsedSecs = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
    
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
    setTimeSpent(prev => ({ ...prev, [qId]: (prev[qId] || 0) + elapsedSecs }));

    if (quizSession.adaptive) {
      const isCorrect = optionIndex === currentQ.correctAnswer;
      if (isCorrect) {
        const newCorrect = correctStreak + 1;
        setCorrectStreak(newCorrect);
        setWrongStreak(0);
        if (newCorrect >= 2 && currentDifficulty !== 'Hard') {
          setCurrentDifficulty(currentDifficulty === 'Easy' ? 'Medium' : 'Hard');
        }
      } else {
        const newWrong = wrongStreak + 1;
        setWrongStreak(newWrong);
        setCorrectStreak(0);
        if (newWrong >= 2 && currentDifficulty !== 'Easy') {
          setCurrentDifficulty(currentDifficulty === 'Hard' ? 'Medium' : 'Easy');
        }
      }
    }
  };

  const handleToggleFlag = () => {
    const qId = currentQ.id;
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    const elapsedSecs = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
    const finalTimeSpent = { ...timeSpent, [currentQ.id]: (timeSpent[currentQ.id] || 0) + elapsedSecs };

    const attempts = questions.map(q => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctAnswer;
      return {
        questionId: q.id,
        topicId: q.topicId,
        topicName: q.topicName,
        concept: q.concept,
        difficulty: q.difficulty,
        selected: selected !== undefined ? selected : null,
        correct: isCorrect,
        timeTaken: finalTimeSpent[q.id] || 20,
        timestamp: Date.now()
      };
    });

    onFinishQuiz({
      sessionId: quizSession.id,
      questions,
      answers,
      timeSpent: finalTimeSpent,
      attempts,
      flaggedArray: Array.from(flagged)
    });
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Quiz Top Bar */}
      <div className="bg-white border-2 border-black p-4 flex items-center justify-between gap-4 shadow-[4px_4px_0px_#000] font-mono">
        <button
          onClick={onQuitQuiz}
          className="neo-btn bg-white hover:bg-yellow-300 text-black px-3.5 py-2 font-bold text-xs inline-flex items-center gap-1.5 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" /> ← BACK TO DASHBOARD
        </button>

        {quizSession.adaptive && (
          <span className="px-2.5 py-1 bg-yellow-300 border border-black font-bold text-xs text-black">
            ADAPTIVE: {currentDifficulty.toUpperCase()}
          </span>
        )}

        {quizSession.timerMins > 0 ? (
          <Timer totalMinutes={quizSession.timerMins} onTimeUp={handleSubmit} />
        ) : (
          <span className="px-2.5 py-1 bg-[#f4f1ea] border border-black font-bold text-xs text-black">
            UNTIMED
          </span>
        )}
      </div>

      {/* Question Card Container */}
      <div className="bg-white border border-[#e5ddd0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_4px_20px_rgba(44,40,37,0.02)]">
        <QuestionCard 
          question={currentQ}
          questionIndex={currentIndex}
          totalQuestions={questions.length}
          selectedOption={answers[currentQ?.id]}
          onSelectOption={handleSelectOption}
          isFlagged={flagged.has(currentQ?.id)}
          onToggleFlag={handleToggleFlag}
        />

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-[#f0eadf]">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#6b6259] hover:bg-[#f4efe6] disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl wabi-btn-primary font-bold text-xs shadow-xs"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5a7361] hover:bg-[#495e4e] text-white font-bold text-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Navigator Grid */}
      <div className="bg-white border border-[#e5ddd0] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-serif font-bold text-[#6b6259]">
          <span>Question Navigator</span>
          <span className="font-sans font-normal">{answeredCount} of {questions.length} Answered</span>
        </div>

        <div className="flex flex-wrap gap-2 font-sans">
          {questions.map((q, idx) => {
            const isAns = answers[q.id] !== undefined;
            const isCur = idx === currentIndex;
            const isFlg = flagged.has(q.id);

            let btnStyle = 'bg-[#fbf9f5] text-[#6b6259] border-[#e5ddd0]';
            if (isAns) btnStyle = 'bg-[#8c6d58] text-white border-[#8c6d58] font-bold';
            if (isFlg) btnStyle = 'bg-[#b8863b] text-white border-[#b8863b] font-bold';
            if (isCur) btnStyle += ' ring-2 ring-[#8c6d58] ring-offset-1';

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-xl border text-xs font-semibold transition-all ${btnStyle}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
