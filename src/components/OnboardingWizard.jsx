import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Check, 
  BrainCircuit,
  Loader2
} from 'lucide-react';
import { Modal, Badge } from './common/CommonUI';
import { aiService } from '../services/aiService';

export function OnboardingWizard({ isOpen, onClose, onCompleteSetup, settings }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Alex Rivera');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [examDate, setExamDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [dailyHours, setDailyHours] = useState(3);
  const [level, setLevel] = useState('Intermediate');

  const [topics, setTopics] = useState([
    { id: 't-1', name: 'Arrays, Two Pointers & Sliding Window' },
    { id: 't-2', name: 'Linked Lists & Pointer Manipulation' },
    { id: 't-3', name: 'Stacks, Queues & Monotonic Structures' },
    { id: 't-4', name: 'Binary Trees & BST Traversals' },
    { id: 't-5', name: 'Dynamic Programming & Recurrence Relations' }
  ]);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [isGeneratingSyllabus, setIsGeneratingSyllabus] = useState(false);

  const handleAddTopic = () => {
    if (!newTopicInput.trim()) return;
    setTopics([...topics, { id: `t-${Date.now()}`, name: newTopicInput.trim() }]);
    setNewTopicInput('');
  };

  const handleRemoveTopic = (id) => {
    setTopics(topics.filter(t => t.id !== id));
  };

  const handleAutoGenerateSyllabus = async () => {
    setIsGeneratingSyllabus(true);
    try {
      const res = await aiService.generateSyllabus({ subjectName: subject, settings });
      if (res.topics && res.topics.length > 0) {
        const formatted = res.topics.map((tName, idx) => ({
          id: `gen-t-${Date.now()}-${idx}`,
          name: tName
        }));
        setTopics(formatted);
      }
    } catch (err) {
      console.error('Error generating syllabus:', err);
    } finally {
      setIsGeneratingSyllabus(false);
    }
  };

  const handleFinish = (launchDiagnostic = false) => {
    const profile = {
      id: `profile-${Date.now()}`,
      name: name.trim() || 'Student',
      subject: subject.trim() || 'General Subject',
      examDate,
      dailyHours: Number(dailyHours) || 2,
      level,
      createdAt: new Date().toISOString()
    };

    const formattedTopics = topics.length > 0 
      ? topics.map(t => ({ id: t.id, name: t.name, profileId: profile.id, category: 'General' }))
      : [
          { id: `t-def-1`, name: 'Core Foundations', profileId: profile.id },
          { id: `t-def-2`, name: 'Advanced Applications', profileId: profile.id }
        ];

    onCompleteSetup({ profile, topics: formattedTopics, launchDiagnostic });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-2xl">
      <div className="py-2 space-y-6">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Welcome to StudyPilot Setup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Personalized AI prep tailored to your exam schedule and learning gaps.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === s
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: Student Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Step 1 of 3: Your Target Exam Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  placeholder="e.g. Alex Rivera"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Exam / Subject Name
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  placeholder="e.g. Data Structures & Algorithms, Operating Systems, DBMS"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Target Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Daily Study Hours
                </label>
                <select
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value={1}>1 Hour / day</option>
                  <option value={2}>2 Hours / day</option>
                  <option value={3}>3 Hours / day</option>
                  <option value={4}>4 Hours / day</option>
                  <option value={6}>6+ Hours / day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Self-Rated Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
              >
                <span>Next: Topic Syllabus</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Topic Syllabus Setup */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Step 2 of 3: Subject Syllabus Topics ({topics.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Add topics or click "Auto-generate syllabus" for AI proposal.
                </p>
              </div>

              <button
                onClick={handleAutoGenerateSyllabus}
                disabled={isGeneratingSyllabus}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isGeneratingSyllabus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Auto-Generate Syllabus</span>
              </button>
            </div>

            {/* Input to add topic */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                placeholder="Type topic name (e.g. Thermodynamics, Optics)..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
              <button
                onClick={handleAddTopic}
                className="px-3 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs hover:bg-slate-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Topics List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {topics.map((t, idx) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {t.name}
                  </span>
                  <button
                    onClick={() => handleRemoveTopic(t.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
              >
                <span>Next: Launch Diagnostic</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Diagnostic Test Ready */}
        {step === 3 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce">
              <BrainCircuit className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Ready for your 10-Question Diagnostic Quiz!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                StudyPilot will instantly map your baseline knowledge gaps across your syllabus topics, score your accuracy, and build your automated revision plan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleFinish(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Start Diagnostic Quiz Now</span>
              </button>
              <button
                onClick={() => handleFinish(false)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Go to Dashboard directly
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
