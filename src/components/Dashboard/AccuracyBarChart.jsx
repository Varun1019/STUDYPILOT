import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';

export function AccuracyBarChart({ topicsMasteryMap }) {
  const data = Object.values(topicsMasteryMap).map(t => ({
    name: t.topicName.length > 12 ? t.topicName.substring(0, 11) + '...' : t.topicName,
    fullTopic: t.topicName,
    accuracy: t.accuracyPct,
    mastery: t.masteryScore,
    status: t.status
  }));

  const getBarColor = (score) => {
    if (score < 50) return '#f43f5e'; // rose-500 for weak
    if (score < 75) return '#f59e0b'; // amber-500 for developing
    return '#10b981'; // emerald-500 for strong
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white text-xs shadow-xl">
                    <div className="font-bold text-indigo-300">{item.fullTopic}</div>
                    <div>Accuracy: <span className="font-extrabold text-white">{item.accuracy}%</span></div>
                    <div>Mastery Level: <span className="font-bold text-indigo-200">{item.mastery}% ({item.status})</span></div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.mastery)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
