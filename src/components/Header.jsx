import React, { useState } from 'react';
import { 
  ChevronDown, 
  Check, 
  Plus, 
  Menu, 
  Settings, 
  BookOpen,
  Sparkles,
  User,
  UserPlus,
  ShieldCheck,
  Download
} from 'lucide-react';
import { Modal } from './common/CommonUI';

export function Header({ 
  activeProfile, 
  profiles = [], 
  uploads = [],
  onSwitchProfile, 
  onSwitchSubject,
  onCreateAccount,
  onOpenNewProfileModal, 
  onOpenUploadModal,
  onOpenSettings,
  onExportData,
  onToggleMobileSidebar
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Account Dropdown & Modal states
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountSubject, setAccountSubject] = useState(activeProfile?.subject || 'Computer Science');
  const [accountExamDate, setAccountExamDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  // Extract subjects created from user uploads
  const uploadSubjects = Array.from(new Set(
    (uploads || []).map(u => u.subject).filter(Boolean)
  ));

  // Extract valid user-created profiles (filtering out any old Generative AI or JEE Physics)
  const validProfiles = (profiles || []).filter(p => 
    p.subject !== 'Generative AI' && 
    !p.subject?.includes('JEE') && 
    !p.subject?.includes('Physics')
  );
  const profileSubjects = validProfiles.map(p => p.subject).filter(Boolean);

  // Dropdown should list subjects created from uploads + profiles
  const availableSubjects = Array.from(new Set([...uploadSubjects, ...profileSubjects])).filter(Boolean);

  const accountInitial = (activeProfile?.name || 'S').trim().charAt(0).toUpperCase() || 'S';

  const handleCreateSubject = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    if (onSwitchSubject) {
      onSwitchSubject(newSubjectName.trim());
    }
    setNewSubjectName('');
    setAddSubjectModalOpen(false);
  };

  const handleAccountFormSubmit = (e) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    if (onCreateAccount) {
      onCreateAccount({
        name: accountName.trim(),
        email: accountEmail.trim(),
        subject: accountSubject.trim() || activeProfile?.subject || 'General Study',
        examDate: accountExamDate
      });
    }

    setAccountName('');
    setAccountEmail('');
    setCreateAccountModalOpen(false);
    setAccountDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b-3 border-black px-3 sm:px-4 lg:px-8 py-3 flex items-center justify-between font-mono">
      {/* LEFT: Mobile Menu Toggle + Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-none border-2 border-black bg-white hover:bg-black hover:text-white transition-colors active:translate-y-[1px] min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-8 h-8 rounded-none bg-[#ff2d2d] text-white font-display flex items-center justify-center text-sm border-2 border-black shadow-[2px_2px_0px_#000]">
            SP
          </div>
          <span className="font-display font-extrabold text-black text-lg sm:text-xl tracking-wider">
            STUDYPILOT
          </span>
        </div>
      </div>

      {/* RIGHT: Settings, Account & Subject Dropdown (Aligned to Far Right Edge) */}
      <div className="flex items-center gap-2 sm:gap-3 justify-end">
        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 sm:p-2.5 rounded-none border-2 border-black bg-white hover:bg-yellow-300 text-black shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Settings & Preferences"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* 1. MAKE AN ACCOUNT / ACCOUNT DROPDOWN (Right near switch subject) */}
        <div className="relative">
          <button
            onClick={() => {
              setAccountDropdownOpen(!accountDropdownOpen);
              setDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-none border-2 border-black bg-white hover:bg-yellow-300 text-xs font-bold text-black shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all min-h-[44px]"
            aria-haspopup="true"
            aria-expanded={accountDropdownOpen}
            title="Account & Storage Persistence"
          >
            <div className="w-5 h-5 rounded-none bg-black text-white font-mono text-[10px] font-bold flex items-center justify-center border border-black shrink-0 shadow-[1px_1px_0px_#ff2d2d]">
              {accountInitial}
            </div>
            <span className="hidden md:inline max-w-[95px] truncate uppercase">
              {activeProfile?.name || 'ACCOUNT'}
            </span>
            <span className="text-[10px] hidden sm:inline-block px-1.5 py-0.5 bg-emerald-200 text-black border border-black font-extrabold uppercase">
              SAVED
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-black shrink-0 transition-transform duration-200 ${accountDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {accountDropdownOpen && (
            <>
              {/* Dismiss backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setAccountDropdownOpen(false)} 
              />

              {/* Account Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-none bg-white border-3 border-black shadow-[6px_6px_0px_#000] z-50 overflow-hidden py-1 text-xs animate-brutal-in">
                {/* Header */}
                <div className="px-3.5 py-2 border-b-2 border-black bg-yellow-300 font-display text-black font-bold text-xs uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> STUDENT ACCOUNT
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5">
                    AUTO-SAVED
                  </span>
                </div>

                {/* Active Account Card */}
                <div className="p-3 bg-[#f4f1ea] border-b-2 border-black space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-bold uppercase">CURRENT ACCOUNT</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      SYNCED
                    </span>
                  </div>

                  <div className="font-bold text-black uppercase text-sm truncate">
                    {activeProfile?.name || 'STUDENT PROFILE'}
                  </div>

                  {activeProfile?.email && (
                    <div className="text-[11px] text-slate-700 truncate font-mono">
                      {activeProfile.email}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-700 font-mono pt-0.5">
                    Target Subject: <strong>[{activeProfile?.subject || 'GENERAL'}]</strong>
                  </div>

                  <div className="text-[10px] text-emerald-900 bg-emerald-100 border border-black p-1.5 font-bold uppercase flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Quizzes, notes &amp; tutor chats auto-saved</span>
                  </div>
                </div>

                {/* Switch Account if multiple exist */}
                {validProfiles.length > 1 && (
                  <div className="max-h-36 overflow-y-auto divide-y divide-black/10 border-b-2 border-black">
                    <div className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                      SWITCH SAVED ACCOUNT
                    </div>
                    {validProfiles.map((p) => {
                      const isCur = activeProfile?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            onSwitchProfile(p.id);
                            setAccountDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 hover:bg-yellow-100 text-left transition-colors font-mono min-h-[38px] ${
                            isCur ? 'bg-yellow-200 font-bold border-l-4 border-l-[#ff2d2d]' : ''
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-bold text-black uppercase truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-600 truncate">{p.subject}</div>
                          </div>
                          {isCur && <Check className="w-3.5 h-3.5 text-[#ff2d2d] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Actions: Make a new account & Export */}
                <div className="p-2 space-y-1.5 bg-[#f4f1ea]">
                  <button
                    onClick={() => {
                      setAccountSubject(activeProfile?.subject || 'Computer Science');
                      setCreateAccountModalOpen(true);
                      setAccountDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#ff2d2d] text-white hover:bg-black font-bold uppercase transition-colors text-xs border-2 border-black shadow-[2px_2px_0px_#000] min-h-[40px]"
                  >
                    <UserPlus className="w-4 h-4" /> + MAKE A NEW ACCOUNT
                  </button>

                  {onExportData && (
                    <button
                      onClick={() => {
                        onExportData();
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-yellow-300 font-bold uppercase transition-colors text-[11px] border border-black min-h-[36px]"
                    >
                      <Download className="w-3.5 h-3.5" /> EXPORT / BACKUP ACCOUNT
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 2. SUBJECT SELECTOR DROPDOWN (Far Right Edge Aligned) */}
        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setAccountDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-none border-2 border-black bg-[#f4f1ea] hover:bg-yellow-300 text-xs font-bold text-black shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all max-w-[150px] sm:max-w-xs truncate min-h-[44px]"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="truncate">
              [{availableSubjects.length > 0 ? (activeProfile?.subject || availableSubjects[0]) : "UPLOAD NOTES TO GET STARTED"}]
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-black shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              {/* Dismiss backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)} 
              />

              {/* Dropdown Menu (Right aligned with page edge) */}
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-none bg-white border-3 border-black shadow-[6px_6px_0px_#000] z-50 overflow-hidden py-1 text-xs animate-brutal-in">
                <div className="px-3.5 py-2 border-b-2 border-black bg-yellow-300 font-display text-black font-bold text-xs uppercase flex items-center justify-between">
                  <span>SUBJECTS FROM UPLOADS</span>
                  <span className="text-[10px] font-mono font-bold">[{availableSubjects.length}]</span>
                </div>

                {/* Available Subjects */}
                <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                  {availableSubjects.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-700 bg-[#f4f1ea] space-y-2">
                      <p className="font-bold text-black uppercase">Upload notes to get started</p>
                      <p className="text-[11px] text-slate-600">No subjects created yet. Upload lecture notes to initialize a subject.</p>
                      <button
                        onClick={() => {
                          if (onOpenUploadModal) onOpenUploadModal();
                          setDropdownOpen(false);
                        }}
                        className="neo-btn bg-[#ff2d2d] text-white hover:bg-black text-[11px] py-2 px-3 mt-1 inline-flex items-center gap-1.5 min-h-[40px]"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> UPLOAD NOTES NOW
                      </button>
                    </div>
                  ) : (
                    availableSubjects.map((subj) => {
                      const matchingProf = validProfiles.find(p => p.subject === subj);
                      const isSelected = activeProfile?.subject === subj;

                      return (
                        <button
                          key={subj}
                          onClick={() => {
                            if (matchingProf) {
                              onSwitchProfile(matchingProf.id);
                            } else if (onSwitchSubject) {
                              onSwitchSubject(subj);
                            }
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-3 hover:bg-slate-100 text-left transition-colors font-mono min-h-[44px] ${
                            isSelected ? 'bg-yellow-100 font-bold border-l-4 border-l-[#ff2d2d]' : ''
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-bold text-black uppercase truncate">
                              {subj}
                            </div>
                            <div className="text-[10px] text-slate-600 truncate">
                              {matchingProf ? matchingProf.name : 'From Uploaded Notes'}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 bg-[#ff2d2d] text-white flex items-center justify-center shrink-0 border border-black shadow-[1px_1px_0px_#000]">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Bottom Action: Add Subject */}
                <div className="border-t-2 border-black bg-[#f4f1ea] p-1">
                  <button
                    onClick={() => {
                      setAddSubjectModalOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-black hover:bg-[#ff2d2d] hover:text-white font-bold transition-colors uppercase border-b border-black text-left text-xs min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" /> + ADD SUBJECT
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Make an Account Modal */}
      {createAccountModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setCreateAccountModalOpen(false)}
          title="MAKE AN ACCOUNT & SAVE DATA"
        >
          <form onSubmit={handleAccountFormSubmit} className="space-y-4 font-mono text-xs text-black">
            <div className="p-3 bg-yellow-100 border-2 border-black flex items-start gap-2 shadow-[2px_2px_0px_#000]">
              <ShieldCheck className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>SAVE YOUR PREP:</strong> Making an account binds all your uploaded notes, flashcards, AI tutor conversations, and quiz history to your personal profile so nothing is lost.
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase block">YOUR NAME / HANDLE: *</label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Varun, Alex Rivera..."
                className="w-full p-3 border-2 border-black bg-white text-xs font-mono min-h-[44px]"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase block">EMAIL OR USER TAG (OPTIONAL):</label>
              <input
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="e.g. student@college.edu"
                className="w-full p-3 border-2 border-black bg-white text-xs font-mono min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase block">PRIMARY SUBJECT / EXAM: *</label>
              <input
                type="text"
                required
                value={accountSubject}
                onChange={(e) => setAccountSubject(e.target.value)}
                placeholder="e.g. Data Structures, Operating Systems..."
                className="w-full p-3 border-2 border-black bg-white text-xs font-mono min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase block">TARGET EXAM DATE:</label>
              <input
                type="date"
                value={accountExamDate}
                onChange={(e) => setAccountExamDate(e.target.value)}
                className="w-full p-3 border-2 border-black bg-white text-xs font-mono min-h-[44px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setCreateAccountModalOpen(false)}
                className="neo-btn bg-white min-h-[44px]"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!accountName.trim() || !accountSubject.trim()}
                className="neo-btn-accent min-h-[44px] disabled:opacity-50"
              >
                CREATE ACCOUNT &amp; SAVE
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Custom Subject Modal */}
      {addSubjectModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setAddSubjectModalOpen(false)}
          title="ADD NEW SUBJECT"
        >
          <form onSubmit={handleCreateSubject} className="space-y-4 font-mono text-xs text-black">
            <div className="space-y-1">
              <label className="font-bold uppercase block">SUBJECT NAME:</label>
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g. Distributed Systems, Machine Learning..."
                className="w-full p-3 border-2 border-black bg-white text-xs font-mono min-h-[44px]"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setAddSubjectModalOpen(false)}
                className="neo-btn bg-white min-h-[44px]"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!newSubjectName.trim()}
                className="neo-btn-accent min-h-[44px] disabled:opacity-50"
              >
                CREATE SUBJECT
              </button>
            </div>
          </form>
        </Modal>
      )}
    </header>
  );
}
