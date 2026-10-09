import React from 'react';
import { Bookmark, CheckCircle2, Tag } from 'lucide-react';
import { Badge } from '../common/CommonUI';

export function QuestionCard({ 
  question, 
  questionIndex, 
  totalQuestions, 
  selectedOption, 
  onSelectOption, 
  isFlagged, 
  onToggleFlag,
  showResult = false // if showing immediate review/result
}) {
  if (!question) return null;

  return (
    <div className="space-y-6 font-mono animate-brutal-in">
      {/* Question Header Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-display font-bold uppercase text-black bg-yellow-300 px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000]">
            QUESTION {questionIndex + 1} OF {totalQuestions}
          </span>
          
          <Badge variant={question.difficulty === 'Hard' ? 'danger' : (question.difficulty === 'Easy' ? 'success' : 'warning')}>
            {question.difficulty || 'Medium'}
          </Badge>

          {question.concept && (
            <span className="text-xs text-black flex items-center gap-1 font-bold">
              <Tag className="w-3.5 h-3.5 text-[#ff2d2d]" /> {question.concept}
            </span>
          )}
        </div>

        <button
          onClick={onToggleFlag}
          className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-xs font-bold transition-all ${
            isFlagged
              ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_#000]'
              : 'bg-white text-black hover:bg-slate-100 shadow-[2px_2px_0px_#000]'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? 'fill-black' : ''}`} />
          <span>{isFlagged ? 'FLAGGED' : 'FLAG FOR REVIEW'}</span>
        </button>
      </div>

      {/* Question Stem */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          TOPIC: {question.topicName}
        </div>
        <h3 className="text-xl sm:text-2xl font-display font-bold text-black leading-snug tracking-wide">
          {question.stem}
        </h3>
      </div>

      {/* 4 Options Grid */}
      <div className="space-y-3 pt-2">
        {question.options?.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const optionLabels = ['A', 'B', 'C', 'D'];
          const isCorrect = showResult && idx === question.correctAnswer;
          const isWrong = showResult && isSelected && idx !== question.correctAnswer;

          return (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              className={`
                w-full text-left p-4 border-2 border-black transition-all flex items-center justify-between gap-3 text-xs sm:text-sm font-bold
                ${isSelected
                  ? 'bg-yellow-300 text-black shadow-[4px_4px_0px_#000] translate-x-[2px] translate-y-[2px] ' + (isWrong ? 'animate-brutal-shake bg-red-200' : 'animate-brutal-pop')
                  : 'bg-white text-black hover:bg-[#f4f1ea] shadow-[3px_3px_0px_#000]'
                }
                ${isCorrect ? 'bg-emerald-300 text-black animate-brutal-pop' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={`
                  w-7 h-7 font-display font-bold text-xs flex items-center justify-center border-2 border-black shrink-0 transition-colors
                  ${isSelected
                    ? 'bg-black text-white'
                    : 'bg-[#f4f1ea] text-black'
                  }
                `}>
                  {optionLabels[idx]}
                </span>
                <span className="leading-snug">{opt}</span>
              </div>

              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
