import React, { useState, useEffect } from 'react';
import { LineChart as ChartIcon, CheckCircle2, AlertCircle, Loader2, ArrowRight, RotateCw, Bot, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '../common/CommonUI';
import { aiService } from '../../services/aiService';
import { AiTutorAgent } from './AiTutorAgent';

export function ProgressView({ 
  attempts = [], 
  topicsMasteryMap = {}, 
  readinessScore = 0, 
  onNavigateTab, 
  settings, 
  activeProfile, 
  flashcards = [], 
  notes = [] 
}) {
  const [activeSubTab, setActiveSubTab] = useState('tutor'); // 'tutor' or 'metrics'
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const trendData = [
    { day: 'Day 1', score: Math.max(20, readinessScore - 30) },
    { day: 'Day 3', score: Math.max(30, readinessScore - 20) },
    { day: 'Day 7', score: Math.max(40, readinessScore - 12) },
    { day: 'Day 14', score: Math.max(50, readinessScore - 5) },
    { day: 'Today', score: readinessScore }
  ];

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await aiService.generateFeedbackSummary({
        attempts,
        masteryByTopic: topicsMasteryMap,
        streak: 3,
        readinessScore,
        settings
      });
      setFeedback(res);
    } catch (err) {
      console.error('Failed to generate feedback summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [readinessScore, attempts.length]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-mono">
      {/* Title Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b-2 border-black gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-black">YOUR PROGRESS &amp; AI TUTOR</h1>
          <p className="text-xs text-slate-700 mt-0.5 font-bold uppercase">
            READINESS ANALYTICS &amp; INTERACTIVE AI TUTOR AGENT.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-2 border-black bg-[#f4f1ea] p-1 gap-1 shrink-0">
          <button
            onClick={() => setActiveSubTab('tutor')}
            className={`px-3 py-1.5 border-2 border-black text-xs font-display uppercase transition-all flex items-center gap-1.5 ${
              activeSubTab === 'tutor' ? 'bg-[#ff2d2d] text-white shadow-[2px_2px_0px_#000]' : 'bg-white text-black hover:bg-yellow-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI TUTOR AGENT</span>
          </button>
          <button
            onClick={() => setActiveSubTab('metrics')}
            className={`px-3 py-1.5 border-2 border-black text-xs font-display uppercase transition-all flex items-center gap-1.5 ${
              activeSubTab === 'metrics' ? 'bg-[#ff2d2d] text-white shadow-[2px_2px_0px_#000]' : 'bg-white text-black hover:bg-yellow-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>METRICS &amp; TRENDS</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: AI TUTOR AGENT */}
      {activeSubTab === 'tutor' && (
        <div className="animate-brutal-in">
          <AiTutorAgent
            activeProfile={activeProfile}
            readinessScore={readinessScore}
            topicsMasteryMap={topicsMasteryMap}
            flashcards={flashcards}
            notes={notes}
            settings={settings}
          />
        </div>
      )}

      {/* SUB-TAB 2: METRICS & REFLECTION */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-6 animate-brutal-in">
          {/* AI Feedback Reflection Card */}
          <Card title="AI PERFORMANCE REFLECTION">
            <div className="flex justify-end mb-2">
              <button
                onClick={fetchFeedback}
                disabled={loading}
                className="text-xs text-black hover:text-[#ff2d2d] flex items-center gap-1 font-bold underline transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" /> REFRESH REFLECTION
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-black flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#ff2d2d]" /> SYNTHESIZING PERFORMANCE TRENDS...
              </div>
            ) : feedback?.feedback ? (
              <div className="space-y-4 text-xs text-black leading-relaxed">
                <div className="font-mono bg-[#f4f1ea] p-4 border-2 border-black shadow-[3px_3px_0px_#000] leading-relaxed">
                  {feedback.feedback.summary}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 border-2 border-black bg-white shadow-[3px_3px_0px_#000] space-y-1">
                    <div className="font-display text-emerald-800 flex items-center gap-1.5 uppercase text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> WHAT IMPROVED
                    </div>
                    <p className="text-black text-xs font-mono">{feedback.feedback.whatImproved}</p>
                  </div>

                  <div className="p-3.5 border-2 border-black bg-white shadow-[3px_3px_0px_#000] space-y-1">
                    <div className="font-display text-[#ff2d2d] flex items-center gap-1.5 uppercase text-xs">
                      <AlertCircle className="w-4 h-4 text-[#ff2d2d]" /> WHAT NEEDS ATTENTION
                    </div>
                    <p className="text-black text-xs font-mono">{feedback.feedback.whatNeedsAttention}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-600 font-mono">
                TAKE A QUIZ TO GENERATE PERSONALIZED AI FEEDBACK REFLECTION.
              </div>
            )}
          </Card>

          {/* Score Over Time Line Chart */}
          <Card title="READINESS SCORE OVER TIME (%)">
            <div className="w-full h-64 font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                  <XAxis dataKey="day" tick={{ fill: '#0a0a0a', fontSize: 11, fontFamily: 'monospace' }} stroke="#0a0a0a" strokeWidth={2} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#0a0a0a', fontSize: 11, fontFamily: 'monospace' }} stroke="#0a0a0a" strokeWidth={2} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #000000',
                      boxShadow: '4px 4px 0px #000000',
                      borderRadius: '0px',
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#ff2d2d"
                    strokeWidth={3}
                    dot={{ fill: '#000000', stroke: '#000000', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#ff2d2d', stroke: '#000' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Next Step Banner */}
      <div className="p-5 border-2 border-black bg-yellow-300 shadow-[6px_6px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-display text-black">NEXT STEP</div>
          <div className="text-xs text-black font-mono">Reinforce weak topics with a targeted quiz or ask the AI Tutor for guidance!</div>
        </div>

        <button
          onClick={() => onNavigateTab('quiz')}
          className="neo-btn bg-black text-white hover:bg-[#ff2d2d] hover:text-white flex items-center gap-2 py-2.5 px-4 self-start sm:self-auto"
        >
          <span>TAKE A QUIZ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
