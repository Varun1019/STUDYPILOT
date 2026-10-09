import React from 'react';
import { Badge } from '../common/CommonUI';

export function TopicHeatmap({ topics, attempts }) {
  const difficulties = ['Easy', 'Medium', 'Hard'];

  // Matrix builder: topicId -> difficulty -> { attempts: count, correct: count, accuracy: % }
  const matrix = {};
  topics.forEach(t => {
    matrix[t.id] = {
      topicName: t.name,
      Easy: { attempts: 0, correct: 0 },
      Medium: { attempts: 0, correct: 0 },
      Hard: { attempts: 0, correct: 0 }
    };
  });

  attempts.forEach(a => {
    if (matrix[a.topicId] && a.difficulty && matrix[a.topicId][a.difficulty]) {
      matrix[a.topicId][a.difficulty].attempts++;
      if (a.correct) matrix[a.topicId][a.difficulty].correct++;
    }
  });

  const getCellBg = (item) => {
    if (item.attempts === 0) return 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800';
    const acc = (item.correct / item.attempts) * 100;
    if (acc < 50) return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 font-bold';
    if (acc < 75) return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 font-bold';
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-extrabold';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400">Topic</th>
            {difficulties.map(d => (
              <th key={d} className="py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 text-center">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {Object.entries(matrix).map(([tId, row]) => (
            <tr key={tId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                {row.topicName}
              </td>
              {difficulties.map(diff => {
                const cellData = row[diff];
                const acc = cellData.attempts > 0 ? Math.round((cellData.correct / cellData.attempts) * 100) : null;
                return (
                  <td key={diff} className="py-2.5 px-2 text-center">
                    <div className={`py-1.5 px-2 rounded-xl border transition-all text-[11px] ${getCellBg(cellData)}`}>
                      {cellData.attempts === 0 ? (
                        <span className="text-[10px] text-slate-400">Not Tested</span>
                      ) : (
                        <span>{acc}% ({cellData.correct}/{cellData.attempts})</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
