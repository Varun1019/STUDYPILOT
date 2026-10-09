import { DEMO_PROFILE, INITIAL_TOPICS, getDefaultTopicsForSubject, DEFAULT_SUBJECTS, DEMO_ATTEMPTS, DEMO_FLASHCARDS, DEMO_NOTES } from './mockData.js';

const STORAGE_KEYS = {
  PROFILES: 'studypilot_profiles',
  ACTIVE_PROFILE_ID: 'studypilot_active_profile_id',
  TOPICS: 'studypilot_topics',
  ATTEMPTS: 'studypilot_attempts',
  QUIZ_SESSIONS: 'studypilot_quiz_sessions',
  FLASHCARDS: 'studypilot_flashcards',
  NOTES: 'studypilot_notes',
  REVISION_PLAN: 'studypilot_revision_plan',
  SETTINGS: 'studypilot_settings',
  UPLOADS: 'studypilot_uploads',
  ACTIVE_UPLOAD_ID: 'studypilot_active_upload_id',
  CHAT_HISTORY: 'studypilot_chat_history'
};

const DEFAULT_SETTINGS = {
  apiKey: '',
  provider: 'gemini',
  model: 'gemini-3.7-flash',
  theme: 'light',
  soundEnabled: true,
  dailyGoalMinutes: 120
};

// Storage helper wrapper with try/catch
const safeGetJSON = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
};

const safeSetJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
};

export const storageService = {
  // --- Profiles & Subjects ---
  getProfiles() {
    const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []);
    // Filter out legacy Generative AI or JEE Physics profiles if any
    return profiles.filter(p => p.subject !== 'Generative AI' && !p.subject?.includes('JEE') && !p.subject?.includes('Physics'));
  },
  
  getActiveProfileId() {
    return safeGetJSON(STORAGE_KEYS.ACTIVE_PROFILE_ID, null);
  },
  
  setActiveProfileId(id) {
    safeSetJSON(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
  },
  
  getActiveProfile() {
    const profiles = this.getProfiles();
    const activeId = this.getActiveProfileId();
    if (!activeId && profiles.length > 0) {
      this.setActiveProfileId(profiles[0].id);
      return profiles[0];
    }
    return profiles.find(p => p.id === activeId) || null;
  },

  saveProfile(profile) {
    const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []);
    const existingIdx = profiles.findIndex(p => p.id === profile.id);
    let updated;
    if (existingIdx >= 0) {
      updated = [...profiles];
      updated[existingIdx] = profile;
    } else {
      updated = [...profiles, profile];
    }
    safeSetJSON(STORAGE_KEYS.PROFILES, updated);
    this.setActiveProfileId(profile.id);
    return profile;
  },

  deleteProfile(profileId) {
    const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []).filter(p => p.id !== profileId);
    safeSetJSON(STORAGE_KEYS.PROFILES, profiles);
    if (this.getActiveProfileId() === profileId) {
      this.setActiveProfileId(profiles[0]?.id || null);
    }
  },

  // --- Uploads Persistence (Every upload saved permanently) ---
  getAllUploads() {
    return safeGetJSON(STORAGE_KEYS.UPLOADS, []);
  },

  getUploads(profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allUploads = safeGetJSON(STORAGE_KEYS.UPLOADS, []);
    if (!pid) return allUploads;
    return allUploads.filter(u => u.profileId === pid);
  },

  getActiveUploadId() {
    return safeGetJSON(STORAGE_KEYS.ACTIVE_UPLOAD_ID, null);
  },

  setActiveUploadId(id) {
    safeSetJSON(STORAGE_KEYS.ACTIVE_UPLOAD_ID, id);
  },

  getActiveUpload(profileId) {
    const uploads = this.getUploads(profileId);
    const activeId = this.getActiveUploadId();
    if (activeId) {
      const found = uploads.find(u => u.id === activeId);
      if (found) return found;
    }
    return uploads[0] || null;
  },

  saveUpload(uploadData, profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allUploads = safeGetJSON(STORAGE_KEYS.UPLOADS, []);
    
    const newUpload = {
      id: uploadData.id || `upload-${Date.now()}`,
      profileId: pid,
      fileName: uploadData.fileName || 'Untitled Notes',
      subject: uploadData.subject || 'General',
      uploadedAt: uploadData.uploadedAt || new Date().toISOString(),
      fileType: uploadData.fileType || 'text/plain',
      extractedText: uploadData.extractedText || '',
      summary: uploadData.summary || '',
      flashcards: uploadData.flashcards || [],
      charCount: uploadData.charCount || (uploadData.extractedText?.length || 0),
      wordCount: uploadData.wordCount || 0
    };

    // Append to uploads without overwriting previous uploads
    const updated = [newUpload, ...allUploads];
    safeSetJSON(STORAGE_KEYS.UPLOADS, updated);
    this.setActiveUploadId(newUpload.id);
    return newUpload;
  },

  updateUpload(uploadId, updates) {
    const allUploads = safeGetJSON(STORAGE_KEYS.UPLOADS, []);
    const updated = allUploads.map(u => u.id === uploadId ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u);
    safeSetJSON(STORAGE_KEYS.UPLOADS, updated);
  },

  deleteUpload(uploadId) {
    const allUploads = safeGetJSON(STORAGE_KEYS.UPLOADS, []).filter(u => u.id !== uploadId);
    safeSetJSON(STORAGE_KEYS.UPLOADS, allUploads);
    if (this.getActiveUploadId() === uploadId) {
      this.setActiveUploadId(allUploads[0]?.id || null);
    }
  },

  // --- Topics ---
  getTopics(profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allTopics = safeGetJSON(STORAGE_KEYS.TOPICS, []);
    return allTopics.filter(t => t.profileId === pid);
  },

  saveTopics(topics, profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allTopics = safeGetJSON(STORAGE_KEYS.TOPICS, []);
    const otherTopics = allTopics.filter(t => t.profileId !== pid);
    const updatedForProfile = topics.map(t => ({ ...t, profileId: pid }));
    safeSetJSON(STORAGE_KEYS.TOPICS, [...otherTopics, ...updatedForProfile]);
  },

  addTopic(topicName, profileId) {
    const topics = this.getTopics(profileId);
    const newTopic = {
      id: `top-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      name: topicName,
      profileId: profileId || this.getActiveProfileId(),
      category: 'General'
    };
    this.saveTopics([...topics, newTopic], profileId);
    return newTopic;
  },

  deleteTopic(topicId, profileId) {
    const topics = this.getTopics(profileId).filter(t => t.id !== topicId);
    this.saveTopics(topics, profileId);
  },

  // --- Attempts / Quiz History ---
  getAttempts(profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allAttempts = safeGetJSON(STORAGE_KEYS.ATTEMPTS, []);
    return allAttempts.filter(a => a.profileId === pid);
  },

  saveAttempt(attempt, profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allAttempts = safeGetJSON(STORAGE_KEYS.ATTEMPTS, []);
    const newAttempt = { ...attempt, profileId: pid, timestamp: attempt.timestamp || Date.now() };
    safeSetJSON(STORAGE_KEYS.ATTEMPTS, [...allAttempts, newAttempt]);
    return newAttempt;
  },

  saveAttemptsBatch(attempts, profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allAttempts = safeGetJSON(STORAGE_KEYS.ATTEMPTS, []);
    const formatted = attempts.map(a => ({ ...a, profileId: pid, timestamp: a.timestamp || Date.now() }));
    safeSetJSON(STORAGE_KEYS.ATTEMPTS, [...allAttempts, ...formatted]);
  },

  // --- Flashcards ---
  getFlashcards(profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allCards = safeGetJSON(STORAGE_KEYS.FLASHCARDS, []);
    return allCards.filter(c => c.profileId === pid);
  },

  saveFlashcards(flashcards, profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allCards = safeGetJSON(STORAGE_KEYS.FLASHCARDS, []);
    const otherCards = allCards.filter(c => c.profileId !== pid);
    const formatted = flashcards.map(c => ({ ...c, profileId: pid }));
    safeSetJSON(STORAGE_KEYS.FLASHCARDS, [...otherCards, ...formatted]);
  },

  toggleFlashcardMastered(cardId, profileId) {
    const cards = this.getFlashcards(profileId);
    const updated = cards.map(c => c.id === cardId ? { ...c, mastered: !c.mastered, lastReviewed: Date.now() } : c);
    this.saveFlashcards(updated, profileId);
  },

  // --- Revision Notes ---
  getNotes(profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allNotes = safeGetJSON(STORAGE_KEYS.NOTES, []);
    return allNotes.filter(n => n.profileId === pid);
  },

  saveNote(note, profileId) {
    const pid = profileId || this.getActiveProfileId();
    const notes = this.getNotes(profileId);
    const existingIdx = notes.findIndex(n => n.topicId === note.topicId || n.id === note.id);
    let updated;
    if (existingIdx >= 0) {
      updated = [...notes];
      updated[existingIdx] = { ...note, profileId: pid, updatedAt: new Date().toISOString() };
    } else {
      updated = [...notes, { ...note, id: note.id || `note-${Date.now()}`, profileId: pid, createdAt: new Date().toISOString() }];
    }
    const allNotes = safeGetJSON(STORAGE_KEYS.NOTES, []).filter(n => n.profileId !== pid);
    safeSetJSON(STORAGE_KEYS.NOTES, [...allNotes, ...updated]);
    return note;
  },

  // --- Revision Plan ---
  getRevisionPlan(profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allPlans = safeGetJSON(STORAGE_KEYS.REVISION_PLAN, {});
    return allPlans[pid] || [];
  },

  saveRevisionPlan(plan, profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allPlans = safeGetJSON(STORAGE_KEYS.REVISION_PLAN, {});
    allPlans[pid] = plan;
    safeSetJSON(STORAGE_KEYS.REVISION_PLAN, allPlans);
  },

  toggleTaskCompleted(taskId, profileId) {
    const plan = this.getRevisionPlan(profileId);
    const updated = plan.map(day => ({
      ...day,
      tasks: day.tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task)
    }));
    this.saveRevisionPlan(updated, profileId);
  },

  // --- AI Tutor Chat History Persistence ---
  getChatHistory(profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allChat = safeGetJSON(STORAGE_KEYS.CHAT_HISTORY, {});
    return allChat[pid] || [];
  },

  saveChatHistory(messages, profileId) {
    const pid = profileId || this.getActiveProfileId();
    const allChat = safeGetJSON(STORAGE_KEYS.CHAT_HISTORY, {});
    allChat[pid] = messages;
    safeSetJSON(STORAGE_KEYS.CHAT_HISTORY, allChat);
  },

  // --- Settings ---
  getSettings() {
    return safeGetJSON(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    safeSetJSON(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // --- Subject Creation & Switch ---
  switchOrCreateSubject(subjectName) {
    const profiles = this.getProfiles();
    const existing = profiles.find(p => p.subject === subjectName);
    if (existing) {
      this.setActiveProfileId(existing.id);
      return existing;
    }

    const newProf = {
      id: `prof-${Date.now()}`,
      name: 'Student Profile',
      subject: subjectName,
      examDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      dailyHours: 3,
      level: 'Intermediate',
      createdAt: new Date().toISOString()
    };

    safeSetJSON(STORAGE_KEYS.PROFILES, [...profiles, newProf]);
    this.setActiveProfileId(newProf.id);

    const topics = getDefaultTopicsForSubject(subjectName).map(t => ({ ...t, profileId: newProf.id }));
    this.saveTopics(topics, newProf.id);

    return newProf;
  },

  // --- Demo Data Loader ---
  loadDemoData() {
    const profiles = safeGetJSON(STORAGE_KEYS.PROFILES, []).filter(p => p.subject !== 'Generative AI' && !p.subject?.includes('JEE'));
    const demoProf = { ...DEMO_PROFILE, id: "demo-profile-1" };
    const filteredProfiles = profiles.filter(p => p.id !== demoProf.id);
    safeSetJSON(STORAGE_KEYS.PROFILES, [demoProf, ...filteredProfiles]);
    this.setActiveProfileId(demoProf.id);

    const demoTopics = INITIAL_TOPICS.map(t => ({ ...t, profileId: demoProf.id }));
    this.saveTopics(demoTopics, demoProf.id);
    this.saveAttemptsBatch(DEMO_ATTEMPTS, demoProf.id);
    this.saveFlashcards(DEMO_FLASHCARDS, demoProf.id);

    return demoProf;
  },

  // --- Export & Import ---
  exportDataJSON() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profiles: this.getProfiles(),
      activeProfileId: this.getActiveProfileId(),
      topics: safeGetJSON(STORAGE_KEYS.TOPICS, []),
      attempts: safeGetJSON(STORAGE_KEYS.ATTEMPTS, []),
      flashcards: safeGetJSON(STORAGE_KEYS.FLASHCARDS, []),
      notes: safeGetJSON(STORAGE_KEYS.NOTES, []),
      uploads: safeGetJSON(STORAGE_KEYS.UPLOADS, []),
      revisionPlan: safeGetJSON(STORAGE_KEYS.REVISION_PLAN, {}),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  },

  importDataJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') throw new Error("Invalid JSON structure");
      
      if (data.profiles) safeSetJSON(STORAGE_KEYS.PROFILES, data.profiles);
      if (data.activeProfileId) safeSetJSON(STORAGE_KEYS.ACTIVE_PROFILE_ID, data.activeProfileId);
      if (data.topics) safeSetJSON(STORAGE_KEYS.TOPICS, data.topics);
      if (data.attempts) safeSetJSON(STORAGE_KEYS.ATTEMPTS, data.attempts);
      if (data.flashcards) safeSetJSON(STORAGE_KEYS.FLASHCARDS, data.flashcards);
      if (data.notes) safeSetJSON(STORAGE_KEYS.NOTES, data.notes);
      if (data.uploads) safeSetJSON(STORAGE_KEYS.UPLOADS, data.uploads);
      if (data.revisionPlan) safeSetJSON(STORAGE_KEYS.REVISION_PLAN, data.revisionPlan);
      if (data.settings) safeSetJSON(STORAGE_KEYS.SETTINGS, data.settings);
      return true;
    } catch (err) {
      console.error("Failed to import data:", err);
      throw err;
    }
  },

  resetAllData() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};
