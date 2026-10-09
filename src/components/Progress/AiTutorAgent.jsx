import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, FileText, Target, RotateCcw, Copy, Check, Lightbulb, BookOpen, Upload, ArrowLeft } from 'lucide-react';
import { Card } from '../common/CommonUI';
import { aiService } from '../../services/aiService';
import { storage } from '../../lib/storage';
import { getTopRelevantChunks } from '../../lib/chunkMatcher';

export function AiTutorAgent({ 
  activeProfile, 
  readinessScore = 50, 
  topicsMasteryMap = {}, 
  flashcards = [], 
  notes = [], 
  settings,
  onNavigateTab,
  onGoBack
}) {
  const [allNotes, setAllNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('ALL');
  const [recentQuizzes, setRecentQuizzes] = useState([]);

  // Load notes and quiz history from Dexie storage
  const reloadContextFromDb = async () => {
    try {
      const dbNotes = await storage.getAllNotes();
      setAllNotes(dbNotes);
      const history = await storage.getQuizHistory(activeProfile?.subject);
      setRecentQuizzes(history.slice(0, 3));
    } catch (err) {
      console.warn('[AiTutorAgent Context Load Error]', err);
    }
  };

  useEffect(() => {
    reloadContextFromDb();
  }, [activeProfile?.id]);

  // Initial welcome message
  const [messages, setMessages] = useState([
    {
      id: 'msg-init',
      role: 'assistant',
      text: `👋 **Hello! I'm your AI Study Coach for ${activeProfile?.subject || 'your course'}.**\n\nI am grounded in your notes and quiz performance. You can ask me to explain confusing topics, quiz you, or draft revision schedules!\n\n*(Tip: Select specific notes above or upload PDFs in "Study & Cards" to target exact class materials.)*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, streamingText]);

  // Handle user query submission with token-by-token streaming & RAG grounding
  const handleSendMessage = async (customQuery = null) => {
    const textToSend = (customQuery || inputQuery).trim();
    if (!textToSend || isThinking) return;

    // 1. Optimistic UI: display user query immediately
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setInputQuery('');
    setIsThinking(true);
    setStreamingText('');

    try {
      // 2. Identify active notes
      const activeNotes = selectedNoteId === 'ALL'
        ? allNotes
        : allNotes.filter(n => n.id === selectedNoteId);

      const activeNoteName = selectedNoteId === 'ALL'
        ? (allNotes.length > 0 ? `All (${allNotes.length} files)` : '')
        : (activeNotes[0]?.fileName || '');

      // 3. Extract 2-3 most relevant chunks using keyword/relevance match
      const relevantChunks = getTopRelevantChunks(textToSend, activeNotes, 3);
      
      const summariesText = activeNotes
        .filter(n => n.summary)
        .map(n => `[NOTE: "${n.fileName}"] SUMMARY:\n${n.summary}`)
        .join('\n\n');

      const excerptsText = relevantChunks
        .map(c => `[NOTE: "${c.fileName}"] EXCERPT:\n${c.chunkText}`)
        .join('\n\n---\n\n');

      const notesContext = [summariesText, excerptsText].filter(Boolean).join('\n\n');

      // 4. Derive recent weak topics from quiz history
      const weakTopics = Object.values(topicsMasteryMap)
        .filter(t => t.masteryScore < 65)
        .map(t => t.topicName);

      if (recentQuizzes.length > 0) {
        for (const q of recentQuizzes) {
          if (q.score < q.total && q.topic && !weakTopics.includes(q.topic)) {
            weakTopics.push(`${q.topic} (scored ${q.score}/${q.total})`);
          }
        }
      }

      const historyPayload = messages.slice(-5).map(m => ({ role: m.role, text: m.text }));

      // 5. Stream response token by token
      await aiService.streamTutorReply({
        query: textToSend,
        subject: activeProfile?.subject || 'Engineering',
        readinessScore,
        weakTopics,
        notesContext,
        activeNoteName,
        history: historyPayload,
        onToken: (token, accumulated) => {
          setStreamingText(accumulated);
        },
        onComplete: (finalReply) => {
          const assistantMsg = {
            id: `tutor-${Date.now()}`,
            role: 'assistant',
            text: finalReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, assistantMsg]);
          setStreamingText('');
          setIsThinking(false);
        },
        onError: (err) => {
          console.error('AI Tutor Stream error:', err);
          setMessages(prev => [
            ...prev,
            {
              id: `tutor-err-${Date.now()}`,
              role: 'assistant',
              text: `⚠️ **AI Coach Notice**: ${err.message || 'Connection timeout. Please retry.'}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setStreamingText('');
          setIsThinking(false);
        }
      });
    } catch (err) {
      console.error('AI Tutor error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `tutor-err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **AI Coach Notice**: ${err.message || 'Unable to connect to AI Coach. Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsThinking(false);
      setStreamingText('');
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestions = [
    `🎯 Explain my weak topics`,
    `📅 Make a 7-day revision plan`,
    `🧠 Quiz me on my active notes`,
    `🃏 Highlight 3 exam traps in my material`
  ];

  return (
    <Card className="border-3 border-black bg-white shadow-[8px_8px_0px_#000] p-0 overflow-hidden font-mono">
      {/* Header Bar */}
      <div className="bg-yellow-300 border-b-3 border-black p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff2d2d] text-white border-2 border-black flex items-center justify-center font-display shadow-[2px_2px_0px_#000]">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-black text-base uppercase tracking-wider flex items-center gap-2">
              <span>AI TUTOR AGENT</span>
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono border border-black">
                FAST AI ENGINE
              </span>
            </h2>
            <p className="text-[11px] text-slate-900 font-bold uppercase">
              RAG NOTES COACH &amp; QUIZ PERFORMANCE TUTOR
            </p>
          </div>
        </div>

        {/* Status Badges & Back Button */}
        <div className="flex items-center gap-2 text-[10px] font-bold">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="px-2.5 py-1.5 bg-white hover:bg-black hover:text-white border-2 border-black text-black font-bold text-xs uppercase flex items-center gap-1 shadow-[2px_2px_0px_#000] min-h-[36px]"
              title="Go Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> BACK
            </button>
          )}

          {allNotes.length > 0 ? (
            <span className="px-2 py-1 bg-white border border-black shadow-[1px_1px_0px_#000] text-black flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#ff2d2d]" /> {allNotes.length} NOTES SAVED
            </span>
          ) : (
            <button
              onClick={() => onNavigateTab && onNavigateTab('study')}
              className="px-2 py-1 bg-red-100 border border-black text-red-700 hover:bg-black hover:text-white transition-colors flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> UPLOAD NOTES
            </button>
          )}

          <button
            onClick={() => {
              setMessages([messages[0]]);
            }}
            className="p-1.5 bg-white hover:bg-black hover:text-white border border-black transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Clear Current Chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Requirement 5: Active Notes Selector Chip */}
      <div className="px-4 py-2.5 bg-yellow-100 border-b-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-black shrink-0" />
          <span className="font-bold text-black uppercase shrink-0">USING NOTES:</span>
          <select
            value={selectedNoteId}
            onChange={(e) => setSelectedNoteId(e.target.value)}
            className="bg-white border-2 border-black px-2.5 py-1 font-bold text-black text-xs uppercase shadow-[2px_2px_0px_#000] outline-hidden cursor-pointer min-h-[32px]"
          >
            <option value="ALL">ALL SAVED NOTES ({allNotes.length})</option>
            {allNotes.map(n => (
              <option key={n.id} value={n.id}>
                {n.fileName}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[10px] text-slate-700 font-bold uppercase">
          {selectedNoteId === 'ALL'
            ? `${allNotes.length} notes active in RAG context`
            : `1 targeted note active`}
        </span>
      </div>

      {/* Suggestion Chips */}
      <div className="p-3 bg-[#f4f1ea] border-b-2 border-black flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-700 shrink-0 uppercase flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" /> QUICK PROMPTS:
        </span>
        {suggestions.map((sugg, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sugg)}
            className="neo-btn text-[10px] py-1.5 px-3 shrink-0 bg-white hover:bg-yellow-300 text-black border border-black shadow-[2px_2px_0px_#000] min-h-[36px]"
          >
            {sugg}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="p-4 sm:p-6 max-h-[440px] min-h-[300px] overflow-y-auto space-y-4 bg-white">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 animate-brutal-in ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 shrink-0 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] ${
                isUser ? 'bg-black text-white' : 'bg-[#ff2d2d] text-white'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] sm:max-w-[78%] p-4 border-2 border-black shadow-[4px_4px_0px_#000] text-xs leading-relaxed font-mono ${
                isUser ? 'bg-black text-white' : 'bg-[#f4f1ea] text-black'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-black/20 text-[10px]">
                  <span className="font-display uppercase tracking-wider">
                    {isUser ? 'YOU' : 'AI TUTOR AGENT'}
                  </span>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="hover:text-black transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Token Streaming Bubble */}
        {isThinking && streamingText && (
          <div className="flex items-start gap-3 animate-brutal-in">
            <div className="w-8 h-8 shrink-0 border-2 border-black bg-[#ff2d2d] text-white flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[85%] sm:max-w-[78%] p-4 border-2 border-black shadow-[4px_4px_0px_#000] text-xs leading-relaxed font-mono bg-[#f4f1ea] text-black">
              <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-black/20 text-[10px]">
                <span className="font-display uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  STREAMING REPLY...
                </span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                {streamingText}
                <span className="inline-block w-2 h-3.5 ml-1 bg-black animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Requirement 6: Skeleton Loader (instead of blocking spinner) */}
        {isThinking && !streamingText && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 shrink-0 border-2 border-black bg-yellow-300 flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-4 h-4 text-black animate-spin" />
            </div>
            <div className="max-w-[75%] p-4 border-2 border-black shadow-[4px_4px_0px_#000] bg-[#f4f1ea] w-full space-y-2">
              <div className="h-3 bg-black/20 w-3/4 rounded-none" />
              <div className="h-3 bg-black/15 w-full rounded-none" />
              <div className="h-3 bg-black/10 w-1/2 rounded-none" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t-3 border-black bg-[#f4f1ea] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask about ${selectedNoteId === 'ALL' ? 'your notes or course' : 'this document'}...`}
          disabled={isThinking}
          className="flex-1 p-3 border-2 border-black bg-white text-xs font-mono text-black placeholder:text-slate-500 focus:outline-hidden min-h-[44px]"
        />

        <button
          type="submit"
          disabled={!inputQuery.trim() || isThinking}
          className="neo-btn-accent text-xs px-5 py-3 flex items-center gap-2 min-h-[44px] disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">SEND</span>
        </button>
      </form>
    </Card>
  );
}
