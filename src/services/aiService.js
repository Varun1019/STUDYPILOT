// StudyPilot Fast AI Service Layer with IndexedDB Caching & Streaming
import { storage } from '../lib/storage.js';

/**
 * Execute fetch to /api/ai with 1 automatic retry on network failure
 */
async function fetchWithRetry(url, options, maxRetries = 1) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      await new Promise(r => setTimeout(r, 400));
    }
  }
}

export const aiService = {
  /**
   * 1. QUESTION GENERATOR (Fast 5 MCQs default, cached)
   */
  async generateQuestions({ subject = 'General', topic, concept, difficulty = 'Medium', count = 5 }) {
    const topicName = typeof topic === 'object' ? topic.name : (topic || 'Core Concepts');
    const topicId = typeof topic === 'object' ? topic.id : 'top-1';
    const numCount = Math.max(3, Math.min(10, Number(count) || 5));

    // Check IndexedDB cache first
    const cacheKey = storage.makeCacheKey('quiz', { subject, topic: topicName, difficulty, count: numCount });
    const cached = await storage.getCache(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return {
        mode: 'Cached',
        questions: cached.map((q, idx) => ({
          ...q,
          id: `q-cached-${Date.now()}-${idx}`,
          topicId,
          topicName
        }))
      };
    }

    try {
      const res = await fetchWithRetry('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quiz',
          subject,
          topic: topicName,
          concept: concept || topicName,
          difficulty,
          count: numCount
        })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const questions = data.questions.map((q, idx) => ({
          ...q,
          id: q.id || `q-${Date.now()}-${idx}`,
          topicId,
          topicName: q.topicName || topicName
        }));

        // Cache for instant future retrieval
        await storage.setCache(cacheKey, questions);
        return { mode: 'AI', questions };
      }
      throw new Error(data.message || data.error || 'Failed to generate quiz questions.');
    } catch (err) {
      console.error('[aiService] generateQuestions error:', err);
      throw new Error(err.message || 'Quiz generation failed. Please check connection.');
    }
  },

  /**
   * 2. REVISION SUMMARY GENERATOR (Cached)
   */
  async generateNotes({ topicName = 'Study Notes', subject = 'General', text = '' }) {
    const cacheKey = storage.makeCacheKey('summary', { topicName, snippet: (text || '').slice(0, 400) });
    const cached = await storage.getCache(cacheKey);
    if (cached) {
      return { mode: 'Cached', text: cached };
    }

    try {
      const res = await fetchWithRetry('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summary',
          subject,
          topicName,
          text: (text || '').slice(0, 10000)
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.text) {
        await storage.setCache(cacheKey, data.text);
        return { mode: 'AI', text: data.text };
      }
      throw new Error(data.message || 'Summary generation returned empty text.');
    } catch (err) {
      console.error('[aiService] generateNotes error:', err);
      throw err;
    }
  },

  /**
   * 3. FLASHCARDS GENERATOR (Cached)
   */
  async generateCardsFromText({ text = '', subject = 'General', topic = 'Key Concepts', count = 15 }) {
    const numCards = Math.max(5, Math.min(25, Number(count) || 15));
    const cacheKey = storage.makeCacheKey('cards', { snippet: text.slice(0, 400), count: numCards });
    const cached = await storage.getCache(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return { success: true, mode: 'Cached', cards: cached };
    }

    try {
      const res = await fetchWithRetry('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flashcards',
          subject,
          topic,
          text: text.slice(0, 12000),
          count: numCards
        })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.cards)) {
        await storage.setCache(cacheKey, data.cards);
        return { success: true, mode: 'AI', cards: data.cards };
      }
      throw new Error(data.message || 'Failed to synthesize flashcards.');
    } catch (err) {
      console.error('[aiService] generateCardsFromText error:', err);
      return { success: false, error: err.message, message: err.message };
    }
  },

  /**
   * 4. STREAMING AI TUTOR (Token-by-Token SSE with optimistic callback)
   */
  async streamTutorReply({ 
    query, 
    subject = 'General', 
    readinessScore = 50, 
    weakTopics = [], 
    notesContext = '', 
    activeNoteName = '', 
    history = [], 
    onToken, 
    onComplete, 
    onError 
  }) {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tutor',
          stream: true,
          query,
          subject,
          readinessScore,
          weakTopics,
          notesContext,
          activeNoteName,
          history
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI Tutor connection error (${response.status}): ${errText}`);
      }

      if (!response.body) {
        throw new Error('Streaming body unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              if (onComplete) onComplete(fullReply);
              return fullReply;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullReply += parsed.text;
                if (onToken) onToken(parsed.text, fullReply);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (pErr) {
              // Ignore non-json chunk lines
            }
          }
        }
      }

      if (onComplete) onComplete(fullReply);
      return fullReply;
    } catch (err) {
      console.warn('[aiService] Streaming tutor error, attempting fallback:', err.message);
      // Fallback to non-streaming if stream drops
      try {
        const fbRes = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'tutor',
            stream: false,
            query,
            subject,
            readinessScore,
            weakTopics,
            notesContext,
            activeNoteName,
            history
          })
        });
        const fbData = await fbRes.json();
        if (fbRes.ok && fbData.reply) {
          if (onToken) onToken(fbData.reply, fbData.reply);
          if (onComplete) onComplete(fbData.reply);
          return fbData.reply;
        }
      } catch {}

      if (onError) onError(err);
      throw err;
    }
  },

  /**
   * 5. EXPLAIN DIFFERENTLY (Simple / Step-by-Step / Analogy)
   */
  async explainDifferently({ questionStem, options, selectedAnswer, correctAnswer, style = 'simple', subject = 'General' }) {
    const cacheKey = storage.makeCacheKey('explain', { stem: questionStem, selectedAnswer, correctAnswer, style });
    const cached = await storage.getCache(cacheKey);
    if (cached) return { mode: 'Cached', text: cached };

    try {
      const res = await fetchWithRetry('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explanation',
          subject,
          questionStem,
          options,
          selectedAnswer,
          correctAnswer,
          style
        })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        await storage.setCache(cacheKey, data.text);
        return { mode: 'AI', text: data.text };
      }
    } catch (e) {
      console.warn('[aiService] explainDifferently error:', e.message);
    }

    return {
      mode: 'Rule',
      text: `For this problem, option (${correctAnswer + 1}) is correct based on governing principles. Choosing option (${(selectedAnswer ?? 0) + 1}) violates boundary constraints.`
    };
  },

  /**
   * 6. SERVER STATUS CHECK
   */
  async checkServerStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) return await res.json();
    } catch {}
    return { status: 'offline', hasKey: false };
  }
};
