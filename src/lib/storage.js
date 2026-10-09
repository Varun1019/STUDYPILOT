import Dexie from 'dexie';

/**
 * StudyPilot IndexedDB Storage Layer using Dexie
 * Stores:
 * - quizHistory: id, subject, topic, score, total, perQuestionResults, difficulty, timestamp, timeSpent
 * - notes: id, fileName, uploadedAt, extractedText, summary, subject, flashcards, status
 * - cache: key, value, createdAt
 */

export const db = new Dexie('StudyPilotDB');

db.version(1).stores({
  quizHistory: 'id, subject, topic, timestamp',
  notes: 'id, fileName, uploadedAt, subject',
  cache: 'key, createdAt'
});

db.version(2).stores({
  accounts: 'id, name, email, createdAt'
});

/**
 * Fast deterministic string hash for cache keys (djb2 + length)
 */
export function hashString(str) {
  let hash = 5381;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return 'c_' + Math.abs(hash).toString(36) + '_' + s.length;
}

export const storage = {
  db,

  // =========================================================================
  // 1. QUIZ HISTORY
  // =========================================================================
  async saveQuizResult({ 
    id, 
    subject = 'General', 
    topic = 'General', 
    score = 0, 
    total = 0, 
    perQuestionResults = [], 
    difficulty = 'Medium', 
    timestamp = Date.now(),
    timeSpent = 0 
  }) {
    const record = {
      id: id || `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      subject: subject || 'General',
      topic: topic || 'General',
      score: Number(score) || 0,
      total: Number(total) || (Array.isArray(perQuestionResults) ? perQuestionResults.length : 0),
      perQuestionResults: Array.isArray(perQuestionResults) ? perQuestionResults : [],
      difficulty: difficulty || 'Medium',
      timestamp: Number(timestamp) || Date.now(),
      timeSpent: Number(timeSpent) || 0
    };

    await db.quizHistory.put(record);
    return record;
  },

  async getQuizHistory(subject = null) {
    let results = await db.quizHistory.toArray();
    if (subject && subject !== 'ALL') {
      results = results.filter(r => r.subject?.toLowerCase() === subject.toLowerCase());
    }
    return results.sort((a, b) => b.timestamp - a.timestamp);
  },

  async getAllQuizHistory() {
    const results = await db.quizHistory.toArray();
    return results.sort((a, b) => b.timestamp - a.timestamp);
  },

  async clearQuizHistory() {
    await db.quizHistory.clear();
  },

  // Derive per-topic scores, attempts, and weak topics from quizHistory
  async getTopicMasteryStats(subject = null) {
    const history = await this.getQuizHistory(subject);
    const topicMap = {};

    for (const h of history) {
      const topicName = h.topic || 'General Concepts';
      if (!topicMap[topicName]) {
        topicMap[topicName] = {
          topicName,
          attempts: 0,
          totalQuestions: 0,
          correctQuestions: 0,
          recentScores: [],
          lastAttempt: h.timestamp,
          difficulty: h.difficulty
        };
      }
      topicMap[topicName].attempts += 1;
      topicMap[topicName].totalQuestions += h.total || 0;
      topicMap[topicName].correctQuestions += h.score || 0;
      topicMap[topicName].recentScores.push(h.total > 0 ? Math.round((h.score / h.total) * 100) : 0);
      if (h.timestamp > topicMap[topicName].lastAttempt) {
        topicMap[topicName].lastAttempt = h.timestamp;
      }
    }

    const topics = Object.values(topicMap).map(t => {
      const accuracyPct = t.totalQuestions > 0 ? Math.round((t.correctQuestions / t.totalQuestions) * 100) : 0;
      return {
        topicId: `top-${hashString(t.topicName)}`,
        topicName: t.topicName,
        totalAttempts: t.attempts,
        accuracyPct,
        masteryScore: accuracyPct,
        status: accuracyPct >= 75 ? 'MASTERED' : accuracyPct >= 50 ? 'DEVELOPING' : 'NEEDS_WORK',
        isWeak: accuracyPct < 65
      };
    });

    const weakTopics = topics.filter(t => t.isWeak || t.masteryScore < 65);
    const overallScore = topics.length > 0 
      ? Math.round(topics.reduce((acc, t) => acc + t.masteryScore, 0) / topics.length)
      : 0;

    return {
      history,
      topics,
      weakTopics,
      overallScore,
      totalQuizzes: history.length
    };
  },

  // =========================================================================
  // 2. NOTES STORE
  // =========================================================================
  async saveNote({ 
    id, 
    fileName, 
    uploadedAt = new Date().toISOString(), 
    extractedText = '', 
    summary = '',
    subject = 'General',
    flashcards = [],
    status = 'done'
  }) {
    const note = {
      id: id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: fileName || 'Untitled Notes',
      uploadedAt: uploadedAt || new Date().toISOString(),
      extractedText: String(extractedText || ''),
      summary: String(summary || ''),
      subject: subject || 'General',
      flashcards: Array.isArray(flashcards) ? flashcards : [],
      status: status || (summary ? 'done' : 'summarizing')
    };

    await db.notes.put(note);
    return note;
  },

  async updateNote(id, updates = {}) {
    if (!id) return;
    await db.notes.update(id, updates);
    return db.notes.get(id);
  },

  async getNotes(subject = null) {
    let list = await db.notes.toArray();
    if (subject && subject !== 'ALL') {
      list = list.filter(n => !n.subject || n.subject.toLowerCase() === subject.toLowerCase());
    }
    return list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  async getAllNotes() {
    const list = await db.notes.toArray();
    return list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  async getNoteById(id) {
    if (!id) return null;
    return db.notes.get(id);
  },

  async deleteNote(id) {
    if (!id) return;
    await db.notes.delete(id);
  },

  // =========================================================================
  // 3. CACHE STORE
  // =========================================================================
  async getCache(key, maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // default 7 days
    try {
      const entry = await db.cache.get(key);
      if (!entry) return null;
      if (maxAgeMs && (Date.now() - entry.createdAt > maxAgeMs)) {
        await db.cache.delete(key);
        return null;
      }
      return entry.value;
    } catch {
      return null;
    }
  },

  async setCache(key, value) {
    try {
      await db.cache.put({
        key,
        value,
        createdAt: Date.now()
      });
    } catch (e) {
      console.warn('[Storage Cache Error]', e);
    }
  },

  async clearCache() {
    await db.cache.clear();
  },

  makeCacheKey(prefix, payload) {
    return `${prefix}_${hashString(JSON.stringify(payload))}`;
  },

  // =========================================================================
  // 4. ACCOUNTS STORE (Save user account & persistence)
  // =========================================================================
  async saveAccount(account) {
    try {
      const record = {
        id: account.id || `acc-${Date.now()}`,
        name: account.name || 'Student',
        email: account.email || '',
        subject: account.subject || 'General Study',
        examDate: account.examDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        createdAt: account.createdAt || new Date().toISOString()
      };
      await db.accounts.put(record);
      return record;
    } catch (e) {
      console.warn('[Storage saveAccount error]', e);
      return account;
    }
  },

  async getAccounts() {
    try {
      return await db.accounts.toArray();
    } catch {
      return [];
    }
  },

  async deleteAccount(id) {
    try {
      if (!id) return;
      await db.accounts.delete(id);
    } catch {}
  },

  // =========================================================================
  // 5. SEED & INITIAL DATA MIGRATION (from localStorage if present)
  // =========================================================================
  async initializeStorage() {
    try {
      const existingNotes = await db.notes.count();
      if (existingNotes === 0) {
        // Check if localStorage has uploads from previous version
        const legacyUploads = localStorage.getItem('studypilot_uploads');
        if (legacyUploads) {
          try {
            const parsed = JSON.parse(legacyUploads);
            if (Array.isArray(parsed) && parsed.length > 0) {
              for (const u of parsed) {
                await db.notes.put({
                  id: u.id || `note-${Date.now()}`,
                  fileName: u.fileName || 'Uploaded Document',
                  uploadedAt: u.uploadedAt || new Date().toISOString(),
                  extractedText: u.extractedText || '',
                  summary: u.summary || '',
                  subject: u.subject || 'Engineering',
                  flashcards: u.flashcards || [],
                  status: 'done'
                });
              }
            }
          } catch {}
        }
      }

      // Check legacy attempts to populate quizHistory if empty
      const existingHistory = await db.quizHistory.count();
      if (existingHistory === 0) {
        const legacyAttempts = localStorage.getItem('studypilot_attempts');
        if (legacyAttempts) {
          try {
            const parsed = JSON.parse(legacyAttempts);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Group by topic/timestamp into quizHistory records
              const grouped = {};
              for (const a of parsed) {
                const grpKey = `${a.topicId || 't'}_${Math.floor((a.timestamp || Date.now()) / 60000)}`;
                if (!grouped[grpKey]) {
                  grouped[grpKey] = {
                    id: `legacy-${grpKey}`,
                    subject: 'Engineering',
                    topic: a.topicName || 'Review Topic',
                    score: 0,
                    total: 0,
                    perQuestionResults: [],
                    difficulty: a.difficulty || 'Medium',
                    timestamp: a.timestamp || Date.now()
                  };
                }
                grouped[grpKey].total += 1;
                if (a.correct) grouped[grpKey].score += 1;
                grouped[grpKey].perQuestionResults.push({
                  questionId: a.questionId,
                  selected: a.selected,
                  correct: a.correct,
                  difficulty: a.difficulty
                });
              }
              for (const rec of Object.values(grouped)) {
                await db.quizHistory.put(rec);
              }
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[Storage Init Error]', err);
    }
  }
};
