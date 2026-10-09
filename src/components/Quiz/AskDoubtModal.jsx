import React, { useState } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Modal, Badge } from '../common/CommonUI';
import { aiService } from '../../services/aiService';

export function AskDoubtModal({ isOpen, onClose, topicName, weakConcepts = [], settings }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your AI Doubt Resolver for **${topicName || 'this topic'}**. What specific step or concept would you like me to clarify?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.askDoubt({
        questionText: userMsg.content,
        topicName,
        weakConcepts,
        chatHistory: nextHistory,
        settings
      });

      setMessages([...nextHistory, { role: 'assistant', content: res.text, mode: res.mode }]);
    } catch (err) {
      console.error('Doubt resolution failed:', err);
      setMessages([
        ...nextHistory,
        { role: 'assistant', content: 'Sorry, I encountered an issue resolving your doubt. Please try asking again!' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ask AI Doubt: ${topicName || 'Topic'}`} maxWidth="max-w-xl">
      <div className="flex flex-col h-[420px]">
        {/* Context header */}
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">Context: <strong>{topicName}</strong></span>
          {weakConcepts.length > 0 && (
            <Badge variant="warning">Weak concepts passed to AI</Badge>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}
              >
                {m.content}
                {m.mode && (
                  <div className="mt-1 text-[9px] text-slate-400 opacity-80 text-right">
                    {m.mode} mode
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-500 font-semibold p-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your doubt (e.g., Why did we use sinθ instead of cosθ?)..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
