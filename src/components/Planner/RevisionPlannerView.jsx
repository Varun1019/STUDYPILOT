import React, { useState } from 'react';
import { Calendar, CheckSquare, Square, Clock, ArrowRight, RotateCw } from 'lucide-react';
import { Card } from '../common/CommonUI';

export function RevisionPlannerView({ 
  plan, 
  onToggleTaskCompleted, 
  onRegeneratePlan, 
  onStartQuizForTopic, 
  onNavigateTab 
}) {
  const [viewMode, setViewMode] = useState('today');

  const todayPlan = plan.find(d => d.isToday) || plan[0];
  const totalTodayTasks = todayPlan?.tasks.length || 0;
  const completedTodayTasks = todayPlan?.tasks.filter(t => t.completed).length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-mono">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b-2 border-black gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-black">REVISION SCHEDULE</h1>
          <p className="text-xs text-slate-700 mt-0.5 font-bold uppercase">
            DAY-BY-DAY TOPIC TASKS BASED ON SPACED REPETITION.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border-2 border-black bg-[#f4f1ea] p-1 text-xs">
            <button
              onClick={() => setViewMode('today')}
              className={`px-3 py-1 font-display uppercase border-2 border-black transition-all ${
                viewMode === 'today' ? 'bg-[#ff2d2d] text-white shadow-[2px_2px_0px_#000]' : 'bg-white text-black hover:bg-yellow-200'
              }`}
            >
              TODAY
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 font-display uppercase border-2 border-black transition-all ${
                viewMode === 'all' ? 'bg-[#ff2d2d] text-white shadow-[2px_2px_0px_#000]' : 'bg-white text-black hover:bg-yellow-200'
              }`}
            >
              ALL DAYS ({plan.length})
            </button>
          </div>

          <button
            onClick={onRegeneratePlan}
            className="p-2 border-2 border-black bg-white hover:bg-yellow-300 text-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            title="Re-sync Schedule"
            aria-label="Re-sync Schedule"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TODAY'S TASKS LIST */}
      {viewMode === 'today' && (
        <Card title={`TODAY'S TASKS (${completedTodayTasks} / ${totalTodayTasks} DONE)`}>
          <div className="space-y-3">
            {todayPlan?.tasks?.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-600 border-2 border-dashed border-black bg-[#f4f1ea]">
                NO TASKS SCHEDULED FOR TODAY.
              </div>
            ) : (
              todayPlan?.tasks?.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 border-2 border-black flex items-center justify-between gap-3 text-xs shadow-[3px_3px_0px_#000] transition-all ${
                    task.completed ? 'bg-slate-100 opacity-60' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTaskCompleted(task.id)}
                      className="text-black hover:text-[#ff2d2d] transition-colors"
                      aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-black" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div>
                      <div className={`font-display text-sm uppercase ${task.completed ? 'line-through text-slate-500' : 'text-black'}`}>
                        {task.title}
                      </div>
                      <div className="text-slate-600 text-[11px] font-mono mt-0.5">
                        TOPIC: <strong className="text-black uppercase">{task.topicName}</strong> • {task.durationMins} MINS
                      </div>
                    </div>
                  </div>

                  {task.type === 'Practice Quiz' && (
                    <button
                      onClick={() => onStartQuizForTopic(task.topicId)}
                      className="neo-btn px-4 py-1.5 text-xs font-display"
                    >
                      PRACTICE
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* ALL DAYS LIST */}
      {viewMode === 'all' && (
        <div className="space-y-4">
          {plan.map((day) => (
            <Card key={day.date} className="space-y-3">
              <div className="flex items-center justify-between text-xs font-display border-b-2 border-black pb-2">
                <span className={day.isToday ? 'text-[#ff2d2d] font-bold' : 'text-black'}>
                  {day.dayLabel.toUpperCase()} ({day.date}) {day.isToday && '• TODAY'}
                </span>
                <span className="text-slate-600 font-mono text-[11px]">{day.tasks.length} TASKS • {day.totalDurationMins}M</span>
              </div>

              <div className="space-y-2">
                {day.tasks.map(t => (
                  <div key={t.id} className="text-xs text-black flex items-center justify-between py-2 px-3 border border-black bg-[#f4f1ea]">
                    <span className="font-mono">{t.title}</span>
                    <span className="text-slate-700 font-mono text-[10px]">{t.durationMins}M</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Next Step Banner */}
      <div className="p-5 border-2 border-black bg-yellow-300 shadow-[6px_6px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-display text-black">NEXT STEP</div>
          <div className="text-xs text-black font-mono">Track your overall score and AI progress feedback.</div>
        </div>

        <button
          onClick={() => onNavigateTab('progress')}
          className="neo-btn bg-black text-white hover:bg-[#ff2d2d] hover:text-white flex items-center gap-2 py-2.5 px-4 self-start sm:self-auto"
        >
          <span>YOUR PROGRESS</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
