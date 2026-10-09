import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, AlertCircle, RotateCcw, Bot, ArrowLeft } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OnboardingWizard } from './components/OnboardingWizard';
import { DashboardView } from './components/Dashboard/DashboardView';
import { QuizSetupModal } from './components/Quiz/QuizSetupModal';
import { QuizView } from './components/Quiz/QuizView';
import { QuizResultsView } from './components/Quiz/QuizResultsView';
import { ManualScoreModal } from './components/Quiz/ManualScoreModal';
import { GapAnalysisView } from './components/GapAnalysis/GapAnalysisView';
import { NotesFlashcardsView } from './components/Notes/NotesFlashcardsView';
import { RevisionPlannerView } from './components/Planner/RevisionPlannerView';
import { ProgressView } from './components/Progress/ProgressView';
import { SettingsView } from './components/Settings/SettingsView';
import { AiTutorAgent } from './components/Progress/AiTutorAgent';
import { FloatingTutorButton } from './components/common/FloatingTutorButton';
import { Modal, BrutalistLoader } from './components/common/CommonUI';

import { storageService } from './services/storageService';
import { storage } from './lib/storage';
import { computeAllTopicsMastery, calculateReadinessScore } from './services/masteryService';
import { generateRevisionPlan, syncAndReschedulePlan } from './services/plannerService';
import { aiService } from './services/aiService';

const TAB_NAMES = {
  home: 'Dashboard',
  quiz: 'Take a Quiz',
  'weak-topics': 'Weak Topics',
  study: 'Study & Cards',
  schedule: 'Revision Schedule',
  progress: 'Your Progress',
  tutor: 'AI Tutor',
  settings: 'Settings'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tabHistory, setTabHistory] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigateToTab = (tab) => {
    if (tab === activeTab && !activeQuizSession && !quizResults) return;
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
    setQuizResults(null);
    setActiveQuizSession(null);
  };

  const handleGoBack = () => {
    if (activeQuizSession) {
      setActiveQuizSession(null);
      return;
    }
    if (quizResults) {
      setQuizResults(null);
      return;
    }
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory(h => h.slice(0, -1));
      setActiveTab(prev);
    } else {
      setActiveTab('home');
    }
  };

  // Storage states
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [notes, setNotes] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [revisionPlan, setRevisionPlan] = useState([]);
  const [settings, setSettings] = useState(storageService.getSettings());

  // Active Quiz Session & Results state
  const [quizSetupModalOpen, setQuizSetupModalOpen] = useState(false);
  const [quizSetupParams, setQuizSetupParams] = useState({ mode: 'MIXED', topicId: null });
  const [activeQuizSession, setActiveQuizSession] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [manualScoreModalOpen, setManualScoreModalOpen] = useState(false);

  // AI Quiz Generation status states
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizGenerationError, setQuizGenerationError] = useState(null);
  const [quizSaveError, setQuizSaveError] = useState(null);
  const [pendingQuizParams, setPendingQuizParams] = useState(null);

  // Onboarding wizard state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load app data on mount or active profile change
  const reloadData = () => {
    const loadedProfiles = storageService.getProfiles();
    let currentActive = storageService.getActiveProfile();
    
    // Purge any legacy JEE/Physics profiles
    if (currentActive && (currentActive.subject?.includes('JEE') || currentActive.subject?.includes('Physics') || currentActive.subject === 'Generative AI')) {
      currentActive = storageService.loadDemoData();
    } else if (!currentActive && loadedProfiles.length === 0) {
      currentActive = storageService.loadDemoData();
    }

    setProfiles(storageService.getProfiles());
    setActiveProfile(currentActive);

    if (currentActive) {
      const curTopics = storageService.getTopics(currentActive.id);
      const curAttempts = storageService.getAttempts(currentActive.id);
      const curCards = storageService.getFlashcards(currentActive.id);
      const curNotes = storageService.getNotes(currentActive.id);
      const curPlan = storageService.getRevisionPlan(currentActive.id);

      setTopics(curTopics);
      setAttempts(curAttempts);
      setFlashcards(curCards);
      setNotes(curNotes);
      setRevisionPlan(curPlan);
    }

    const allUploads = storageService.getAllUploads();
    setUploads(allUploads);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Derived calculated metrics
  const topicsMasteryMap = useMemo(() => {
    return computeAllTopicsMastery(topics, attempts);
  }, [topics, attempts]);

  const readinessScore = useMemo(() => {
    return calculateReadinessScore(topics, attempts);
  }, [topics, attempts]);

  // Keep revision plan synced
  useEffect(() => {
    if (activeProfile && topics.length > 0) {
      const synced = syncAndReschedulePlan(
        revisionPlan, 
        topics, 
        topicsMasteryMap, 
        activeProfile.examDate, 
        activeProfile.dailyHours
      );
      setRevisionPlan(synced);
      storageService.saveRevisionPlan(synced, activeProfile.id);
    }
  }, [topics.length, attempts.length, activeProfile?.id]);

  // Handlers
  const handleSwitchProfile = (profileId) => {
    storageService.setActiveProfileId(profileId);
    setQuizResults(null);
    setActiveQuizSession(null);
    reloadData();
  };

  const handleSwitchSubject = (subjectName) => {
    storageService.switchOrCreateSubject(subjectName);
    setQuizResults(null);
    setActiveQuizSession(null);
    reloadData();
  };

  const handleCreateAccount = async ({ name, email, subject, examDate }) => {
    const newProfile = {
      id: `acc-${Date.now()}`,
      name: name.trim() || 'Student',
      email: email?.trim() || '',
      subject: subject.trim() || 'General Study',
      examDate: examDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      dailyHours: 3,
      level: 'Intermediate',
      createdAt: new Date().toISOString()
    };

    storageService.saveProfile(newProfile);
    try {
      await storage.saveAccount(newProfile);
    } catch (e) {
      console.warn('Dexie saveAccount note:', e);
    }

    // Initialize initial syllabus topics for this account's primary subject
    const defaultTopics = [
      { id: `t-${Date.now()}-1`, name: `${newProfile.subject} Foundations`, profileId: newProfile.id, category: 'Core' },
      { id: `t-${Date.now()}-2`, name: `Applied ${newProfile.subject}`, profileId: newProfile.id, category: 'Core' }
    ];
    storageService.saveTopics(defaultTopics, newProfile.id);

    setQuizResults(null);
    setActiveQuizSession(null);
    reloadData();
  };

  const handleLoadDemoData = () => {
    storageService.loadDemoData();
    setQuizResults(null);
    setActiveQuizSession(null);
    reloadData();
  };

  const handleCompleteOnboarding = ({ profile, topics: newTopics, launchDiagnostic }) => {
    storageService.saveProfile(profile);
    storageService.saveTopics(newTopics, profile.id);
    setShowOnboarding(false);
    reloadData();

    if (launchDiagnostic) {
      handleLaunchQuizSession({ mode: 'DIAGNOSTIC', count: 10, timerMins: 10, adaptive: true });
    }
  };

  const handleOpenQuizSetup = (mode = 'MIXED', topicId = null) => {
    setQuizSetupParams({ mode, topicId });
    setQuizSetupModalOpen(true);
  };

  const handleLaunchQuizSession = async ({ mode, topicId, count = 10, timerMins = 10, adaptive = true }) => {
    setQuizSetupModalOpen(false);
    setQuizResults(null);
    setQuizGenerationError(null);
    setPendingQuizParams({ mode, topicId, count, timerMins, adaptive });

    let targetTopic = topics.find(t => t.id === topicId) || topics[0];
    const currentSubject = activeProfile?.subject || (uploads && uploads.length > 0 ? uploads[0].subject : 'General Study');

    setIsGeneratingQuiz(true);
    try {
      const res = await aiService.generateQuestions({
        subject: currentSubject,
        topic: targetTopic,
        difficulty: 'Medium',
        count,
        settings
      });

      if (!res?.questions || res.questions.length === 0) {
        throw new Error("No questions were generated. Verify that your API key is configured.");
      }

      const session = {
        id: `quiz-session-${Date.now()}`,
        mode,
        topicId: targetTopic?.id,
        topicName: targetTopic?.name,
        questions: res.questions,
        timerMins,
        adaptive,
        startTime: Date.now()
      };

      setActiveQuizSession(session);
    } catch (err) {
      console.error('Quiz generation error:', err);
      setQuizGenerationError(err.message || 'Failed to generate quiz questions.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleFinishQuiz = async ({ sessionId, questions, answers, timeSpent, attempts: newAttempts }) => {
    const currentSubject = activeProfile?.subject || (uploads && uploads.length > 0 ? uploads[0].subject : 'General Study');
    
    // Save full result to Dexie IndexedDB storage
    try {
      const perQuestionResults = questions.map(q => ({
        questionId: q.id,
        stem: q.stem,
        userAnswer: answers[q.id],
        correctAnswer: q.correctAnswer,
        isCorrect: answers[q.id] === q.correctAnswer,
        difficulty: q.difficulty || 'Medium',
        topic: q.topicName || q.topic || activeQuizSession?.topicName || 'General',
        explanation: q.explanation || ''
      }));

      const correctCount = perQuestionResults.filter(p => p.isCorrect).length;

      await storage.saveQuizResult({
        subject: currentSubject,
        topic: activeQuizSession?.topicName || questions[0]?.topicName || 'General',
        score: correctCount,
        total: questions.length,
        perQuestionResults,
        difficulty: activeQuizSession?.adaptive ? 'Adaptive' : 'Medium',
        timestamp: Date.now(),
        timeSpent: Object.values(timeSpent || {}).reduce((a, b) => a + b, 0)
      });
      setQuizSaveError(null);
    } catch (saveErr) {
      console.error('Failed to save quiz result to IndexedDB:', saveErr);
      setQuizSaveError('Failed to save quiz results to local IndexedDB.');
    }

    if (activeProfile) {
      storageService.saveAttemptsBatch(newAttempts, activeProfile.id);
      
      const missed = questions.filter(q => answers[q.id] !== q.correctAnswer);
      if (missed.length > 0) {
        const newFlashcards = missed.map(m => ({
          id: `fc-missed-${m.id}-${Date.now()}`,
          topicId: m.topicId,
          topicName: m.topicName,
          front: `[Missed Question] ${m.stem}`,
          back: `Correct Answer: ${m.options?.[m.correctAnswer]}\n\nExplanation: ${m.explanation}`,
          mastered: false,
          lastReviewed: Date.now()
        }));

        const existingCards = storageService.getFlashcards(activeProfile.id);
        storageService.saveFlashcards([...newFlashcards, ...existingCards], activeProfile.id);
      }
    }

    setQuizResults({ questions, answers, timeSpent, attempts: newAttempts });
    setActiveQuizSession(null);
    reloadData();
  };

  const handleSaveNote = (note) => {
    if (activeProfile) {
      storageService.saveNote(note, activeProfile.id);
      setNotes(storageService.getNotes(activeProfile.id));
    }
  };

  const handleSaveFlashcards = (newCards) => {
    if (activeProfile) {
      storageService.saveFlashcards(newCards, activeProfile.id);
      setFlashcards(newCards);
    }
  };

  const handleToggleFlashcardMastered = (cardId) => {
    if (activeProfile) {
      storageService.toggleFlashcardMastered(cardId, activeProfile.id);
      setFlashcards(storageService.getFlashcards(activeProfile.id));
    }
  };

  const handleToggleTaskCompleted = (taskId) => {
    if (activeProfile) {
      storageService.toggleTaskCompleted(taskId, activeProfile.id);
      setRevisionPlan(storageService.getRevisionPlan(activeProfile.id));
    }
  };

  const handleSaveSettings = (newSettings) => {
    const updated = storageService.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleExportData = () => {
    const jsonStr = storageService.exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyPilot_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr) => {
    storageService.importDataJSON(jsonStr);
    reloadData();
  };

  const handleResetAllData = () => {
    storageService.resetAllData();
    setProfiles([]);
    setActiveProfile(null);
    setTopics([]);
    setAttempts([]);
    setFlashcards([]);
    setNotes([]);
    setRevisionPlan([]);
    setShowOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#0a0a0a] flex flex-col font-mono selection:bg-[#ff2d2d] selection:text-white">
      {/* Header */}
      <Header
        activeProfile={activeProfile}
        profiles={profiles}
        uploads={uploads}
        onSwitchProfile={handleSwitchProfile}
        onSwitchSubject={handleSwitchSubject}
        onCreateAccount={handleCreateAccount}
        onOpenNewProfileModal={() => setShowOnboarding(true)}
        onOpenUploadModal={() => navigateToTab('study')}
        onOpenSettings={() => navigateToTab('settings')}
        onExportData={handleExportData}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => navigateToTab(tab)}
          activeProfile={activeProfile}
          readinessScore={readinessScore}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {/* Universal Back Button for Window / Tab Navigation */}
          {(activeTab !== 'home' || activeQuizSession || quizResults || tabHistory.length > 0) && (
            <div className="mb-4 flex items-center justify-between pb-3 border-b-2 border-black/20">
              <button
                onClick={handleGoBack}
                className="neo-btn bg-white hover:bg-yellow-300 text-black px-4 py-2 font-mono font-bold text-xs inline-flex items-center gap-2 shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all min-h-[42px]"
                title="Go back to previous window"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>
                  ← BACK TO {activeQuizSession || quizResults ? 'DASHBOARD' : (TAB_NAMES[tabHistory[tabHistory.length - 1]]?.toUpperCase() || 'DASHBOARD')}
                </span>
              </button>

              <span className="text-[11px] font-mono text-black font-bold uppercase hidden sm:inline bg-yellow-200 border border-black px-2.5 py-1 shadow-[1px_1px_0px_#000]">
                VIEW: {activeQuizSession ? 'ACTIVE QUIZ' : (quizResults ? 'QUIZ RESULTS' : (TAB_NAMES[activeTab]?.toUpperCase() || activeTab.toUpperCase()))}
              </span>
            </div>
          )}

          {activeQuizSession ? (
            <QuizView
              quizSession={activeQuizSession}
              onFinishQuiz={handleFinishQuiz}
              onQuitQuiz={handleGoBack}
            />
          ) : quizResults ? (
            <QuizResultsView
              results={quizResults}
              onRetakeQuiz={() => handleLaunchQuizSession({ mode: 'MIXED', count: 10, timerMins: 10, adaptive: true })}
              onNavigateWeakTopics={() => navigateToTab('weak-topics')}
              onBackToDashboard={handleGoBack}
              settings={settings}
            />
          ) : (
            <div key={activeTab} className="animate-tab-switch">
              {activeTab === 'home' && (
                <DashboardView
                  activeProfile={activeProfile}
                  topics={topics}
                  attempts={attempts}
                  topicsMasteryMap={topicsMasteryMap}
                  readinessScore={readinessScore}
                  quizSaveError={quizSaveError}
                  onStartQuiz={(mode, topicId) => handleLaunchQuizSession({ mode: mode || 'DIAGNOSTIC', topicId, count: 10, timerMins: 10, adaptive: true })}
                  onNavigateTab={(tab) => navigateToTab(tab)}
                  onOpenManualScoreModal={() => setManualScoreModalOpen(true)}
                />
              )}

              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-display text-black">TAKE A QUIZ</h1>
                      <p className="text-xs text-slate-700 mt-0.5 font-bold uppercase">
                        CHOOSE QUIZ MODE AND TEST YOUR KNOWLEDGE.
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenQuizSetup('MIXED')}
                      className="neo-btn bg-white hover:bg-yellow-300 text-black px-4 py-2 font-display text-xs min-h-[44px]"
                    >
                      CONFIGURE OPTIONS
                    </button>
                  </div>

                  <DashboardView
                    activeProfile={activeProfile}
                    topics={topics}
                    attempts={attempts}
                    topicsMasteryMap={topicsMasteryMap}
                    readinessScore={readinessScore}
                    quizSaveError={quizSaveError}
                    onStartQuiz={(mode, topicId) => handleLaunchQuizSession({ mode: mode || 'DIAGNOSTIC', topicId, count: 10, timerMins: 10, adaptive: true })}
                    onNavigateTab={(tab) => navigateToTab(tab)}
                    onOpenManualScoreModal={() => setManualScoreModalOpen(true)}
                  />
                </div>
              )}

              {activeTab === 'weak-topics' && (
                <GapAnalysisView
                  topicsMasteryMap={topicsMasteryMap}
                  onStartQuizForTopic={(topicId) => handleLaunchQuizSession({ mode: 'TOPIC', topicId, count: 5, timerMins: 5, adaptive: true })}
                  onNavigateTab={(tab) => navigateToTab(tab)}
                />
              )}

              {activeTab === 'study' && (
                <NotesFlashcardsView
                  topics={topics}
                  notes={notes}
                  flashcards={flashcards}
                  activeProfile={activeProfile}
                  onSaveNote={handleSaveNote}
                  onSaveFlashcards={handleSaveFlashcards}
                  onToggleFlashcardMastered={handleToggleFlashcardMastered}
                  onNavigateTab={(tab) => navigateToTab(tab)}
                  onUploadChange={reloadData}
                  settings={settings}
                />
              )}

              {activeTab === 'schedule' && (
                <RevisionPlannerView
                  plan={revisionPlan}
                  onToggleTaskCompleted={handleToggleTaskCompleted}
                  onRegeneratePlan={() => {
                    if (activeProfile) {
                      const newPlan = generateRevisionPlan(activeProfile.examDate, activeProfile.dailyHours, topics, topicsMasteryMap);
                      setRevisionPlan(newPlan);
                      storageService.saveRevisionPlan(newPlan, activeProfile.id);
                    }
                  }}
                  onStartQuizForTopic={(topicId) => handleLaunchQuizSession({ mode: 'TOPIC', topicId, count: 5, timerMins: 5, adaptive: true })}
                  onNavigateTab={(tab) => navigateToTab(tab)}
                />
              )}

              {activeTab === 'progress' && (
                <ProgressView
                  attempts={attempts}
                  topicsMasteryMap={topicsMasteryMap}
                  readinessScore={readinessScore}
                  onNavigateTab={(tab) => navigateToTab(tab)}
                  settings={settings}
                  activeProfile={activeProfile}
                  flashcards={flashcards}
                  notes={notes}
                />
              )}

              {/* Requirement 4: Dedicated AI Tutor Tab View */}
              {activeTab === 'tutor' && (
                <div className="space-y-6">
                  <div className="pb-3 border-b-2 border-black">
                    <h1 className="text-2xl sm:text-3xl font-display text-black">AI STUDY AGENT</h1>
                    <p className="text-xs text-slate-700 mt-0.5 font-bold uppercase">
                      PERSONALIZED EXAM COACH TRAINED ON YOUR UPLOADED NOTES AND QUIZ PERFORMANCE.
                    </p>
                  </div>

                  <AiTutorAgent
                    activeProfile={activeProfile}
                    readinessScore={readinessScore}
                    topicsMasteryMap={topicsMasteryMap}
                    flashcards={flashcards}
                    notes={notes}
                    settings={settings}
                    onNavigateTab={(tab) => navigateToTab(tab)}
                    onGoBack={handleGoBack}
                  />
                </div>
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onLoadDemoData={handleLoadDemoData}
                  onExportData={handleExportData}
                  onImportData={handleImportData}
                  onResetAllData={handleResetAllData}
                  onNavigateTab={(tab) => navigateToTab(tab)}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Requirement 4: Floating Chat Button for AI Study Agent */}
      <FloatingTutorButton
        activeProfile={activeProfile}
        readinessScore={readinessScore}
        topicsMasteryMap={topicsMasteryMap}
        flashcards={flashcards}
        notes={notes}
        settings={settings}
        onNavigateTab={(tab) => navigateToTab(tab)}
      />

      {/* Quiz Setup Modal */}
      <QuizSetupModal
        isOpen={quizSetupModalOpen}
        onClose={() => setQuizSetupModalOpen(false)}
        topics={topics}
        onLaunchQuiz={handleLaunchQuizSession}
        initialMode={quizSetupParams.mode}
        initialTopicId={quizSetupParams.topicId}
      />

      {/* Manual Score Entry Modal */}
      <ManualScoreModal
        isOpen={manualScoreModalOpen}
        onClose={() => setManualScoreModalOpen(false)}
        topics={topics}
        onSaveManualAttempts={(newAttempts) => {
          if (activeProfile) {
            storageService.saveAttemptsBatch(newAttempts, activeProfile.id);
            reloadData();
          }
        }}
      />

      {/* First-Run Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onCompleteSetup={handleCompleteOnboarding}
        settings={settings}
      />

      {/* AI Quiz Generating Loading Overlay */}
      {isGeneratingQuiz && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-3 border-black shadow-[8px_8px_0px_#000] p-6 max-w-md w-full animate-brutal-in text-center font-mono">
            <div className="w-12 h-12 bg-yellow-300 border-2 border-black flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#000]">
              <Sparkles className="w-6 h-6 text-black animate-spin" />
            </div>
            <h3 className="font-display text-lg text-black uppercase mb-1">GENERATING AI QUIZ...</h3>
            <p className="text-xs text-slate-700 font-mono mb-4">
              Synthesizing exam questions for <strong className="text-black uppercase">{activeProfile?.subject || (uploads && uploads.length > 0 ? uploads[0].subject : 'General Study')}</strong>...
            </p>
            <BrutalistLoader text="SYNTHESIZING QUESTIONS & EXPLANATIONS..." />
          </div>
        </div>
      )}

      {/* AI Generation Notice / Retry Modal (Zero Offline Mode) */}
      {quizGenerationError && (
        <Modal
          isOpen={true}
          onClose={() => setQuizGenerationError(null)}
          title="AI GENERATION NOTICE"
        >
          <div className="space-y-4 font-mono text-xs text-black">
            <div className="p-3 border-2 border-black bg-[#ff2d2d]/10 text-black flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-[#ff2d2d] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold uppercase text-[#ff2d2d]">Quiz Generation Notice:</div>
                <div className="mt-1">{quizGenerationError}</div>
              </div>
            </div>
            <p className="text-slate-700">
              Please check your API key configuration and network connection, then click retry.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-end">
              <button
                onClick={() => {
                  setQuizGenerationError(null);
                  if (pendingQuizParams) {
                    handleLaunchQuizSession(pendingQuizParams);
                  }
                }}
                className="neo-btn bg-yellow-300 hover:bg-yellow-400 text-black py-2.5 px-4 flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" /> RETRY GENERATION
              </button>
              <button
                onClick={() => setQuizGenerationError(null)}
                className="px-3 py-2.5 border-2 border-black font-bold uppercase hover:bg-slate-200 transition-colors min-h-[44px]"
              >
                CLOSE
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
