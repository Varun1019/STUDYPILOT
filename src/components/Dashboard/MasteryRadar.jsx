import React from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip 
} from 'recharts';

export function MasteryRadar({ topicsMasteryMap }) {
  const data = Object.values(topicsMasteryMap).map(t => ({
    topic: t.topicName.length > 15 ? t.topicName.substring(0, 14) + '...' : t.topicName,
    fullTopic: t.topicName,
    mastery: t.masteryScore,
    accuracy: t.accuracyPct
  }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No topic data available. Take a diagnostic test!
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="topic" 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Radar 
            name="Mastery Score" 
            dataKey="mastery" 
            stroke="#6366f1" 
            fill="#6366f1" 
            fillOpacity={0.4} 
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white text-xs shadow-xl">
                    <div className="font-bold text-indigo-300">{item.fullTopic}</div>
                    <div>Mastery Score: <span className="font-extrabold text-white">{item.mastery}%</span></div>
                    <div>Accuracy: <span className="font-bold text-slate-300">{item.accuracy}%</span></div>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
