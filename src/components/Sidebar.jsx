import React from 'react';
import { 
  Home, 
  HelpCircle, 
  Target, 
  BookOpen, 
  Calendar, 
  LineChart, 
  Bot,
  X 
} from 'lucide-react';

export function Sidebar({ activeTab, onSelectTab, activeProfile, readinessScore = 0, isMobileOpen, onCloseMobile }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'quiz', label: 'Take a Quiz', icon: HelpCircle },
    { id: 'weak-topics', label: 'Your Weak Topics', icon: Target },
    { id: 'study', label: 'Study & Cards', icon: BookOpen },
    { id: 'schedule', label: 'Revision Schedule', icon: Calendar },
    { id: 'progress', label: 'Your Progress', icon: LineChart },
    { id: 'tutor', label: 'AI Tutor', icon: Bot }
  ];

  const examDate = activeProfile?.examDate ? new Date(activeProfile.examDate) : new Date(Date.now() + 30 * 86400000);
  const daysLeft = Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#0a0a0a]/60 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 lg:top-[59px] left-0 z-40
        w-64 h-full lg:h-[calc(100vh-59px)]
        bg-[#f4f1ea] border-r-3 border-black
        flex flex-col justify-between p-4 transition-transform duration-200 ease-out font-mono
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Navigation */}
        <div className="space-y-6">
          <div className="flex items-center justify-between lg:hidden pb-3 border-b-2 border-black">
            <span className="font-display text-black text-sm uppercase">MENU</span>
            <button onClick={onCloseMobile} className="p-2 text-black border-2 border-black bg-white hover:bg-black hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-3 rounded-none text-xs uppercase font-bold text-left border-2 border-black
                    transition-all duration-200 ease-out transform min-h-[44px]
                    ${isActive
                      ? 'bg-[#ff2d2d] text-white shadow-[4px_4px_0px_#000] translate-x-1 animate-tab-indicator font-extrabold'
                      : 'bg-white text-black hover:bg-yellow-300 hover:shadow-[3px_3px_0px_#000] hover:translate-x-1'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-black'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-yellow-300 border border-black shadow-[1px_1px_0px_#000] animate-pulse-fast shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Exam & Readiness Block (Follows selected subject) */}
        <div className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000] text-xs font-mono space-y-1">
          <div className="font-bold text-black uppercase truncate">
            [{activeProfile?.subject || "SELECT SUBJECT"}]
          </div>
          <div className="text-[11px] text-black">
            EXAM IN <strong>{daysLeft} DAYS</strong> • <strong>{readinessScore}% READY</strong>
          </div>
        </div>
      </aside>
    </>
  );
}
