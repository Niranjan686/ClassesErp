import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, BookOpen, Layers, CreditCard, Video, Sparkles, X, ArrowRight } from 'lucide-react';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { title: 'Dashboard Overview', icon: Sparkles, path: '/dashboard', category: 'Navigation' },
    { title: 'Student Master & 360° Profiles', icon: Users, path: '/student-master', category: 'Students' },
    { title: 'Student PVC Identity Cards', icon: Users, path: '/students', category: 'Students' },
    { title: 'Fee Management & Collections', icon: CreditCard, path: '/fee-management', category: 'Finance' },
    { title: 'Course Master & Syllabi', icon: BookOpen, path: '/course-master', category: 'Academics' },
    { title: 'Batch Timetable & Schedules', icon: Layers, path: '/batch-master', category: 'Academics' },
    { title: 'Live Video Class Studio (Jitsi)', icon: Video, path: '/live-classes', category: 'Live Learning' },
    { title: 'Study Notes & PDF Material', icon: BookOpen, path: '/study-notes', category: 'Academics' },
    { title: 'Daily Attendance Grid & QR Scan', icon: Layers, path: '/attendance-entry', category: 'Attendance' },
    { title: 'Leads CRM Pipeline (Kanban)', icon: Sparkles, path: '/enquiries', category: 'Growth' },
    { title: 'Demo Lecture Scheduler', icon: Video, path: '/demo-schedule', category: 'Growth' },
    { title: 'Exam Marksheets & Report Cards', icon: BookOpen, path: '/marks-entry', category: 'Assessments' },
    { title: 'Super Admin Franchise Console', icon: Sparkles, path: '/super-admin', category: 'SaaS' },
    { title: 'Switch to Student Portal View', icon: Users, path: '/student-portal', category: 'Portal' },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Type a command or search modules... (Esc to close)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
            autoFocus
          />
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50 dark:divide-slate-800/50">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No matching actions or modules found for "{search}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Navigate with <b>Ctrl + K</b> anywhere</span>
          <span>Press <b>ESC</b> to dismiss</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
