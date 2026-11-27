import React from 'react';
import { useErp } from '../../context/ErpContext';
import { UserRole } from '../../types';
import { FACTORY_INFO } from '../../data/seedData';
import {
  Building2,
  Smartphone,
  ShieldCheck,
  Factory,
  BarChart3,
  Crown,
  Languages,
  RotateCcw,
  PlayCircle,
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  User,
} from 'lucide-react';

interface NavbarProps {
  onOpenBenchmark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBenchmark }) => {
  const {
    currentUser,
    logout,
    role,
    setRole,
    lang,
    setLang,
    resetToBenchmarkBaseline,
    notifications,
    clearNotification,
  } = useErp();

  const [showNotifs, setShowNotifs] = React.useState(false);

  const roles: { id: UserRole; label: string; labelTa: string; icon: React.ReactNode; color: string }[] = [
    { id: 'salesman', label: 'Field Salesman', labelTa: 'விற்பனையாளர்', icon: <Smartphone className="w-4 h-4" />, color: 'bg-emerald-600' },
    { id: 'admin', label: 'Factory Admin', labelTa: 'நிர்வாகி', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-blue-600' },
    { id: 'production', label: 'Production Floor', labelTa: 'உற்பத்தித் துறை', icon: <Factory className="w-4 h-4" />, color: 'bg-amber-600' },
    { id: 'auditor', label: 'Auditor & Accounts', labelTa: 'தணிக்கையாளர்', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-purple-600' },
    { id: 'owner', label: 'Owner Executive', labelTa: 'உரிமையாளர்', icon: <Crown className="w-4 h-4" />, color: 'bg-brand-600' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 select-none shadow-md">
      {/* Top Banner with Factory & NIT Trichy attribution */}
      <div className="bg-gradient-to-r from-brand-900 via-slate-900 to-slate-900 text-xs py-1 px-4 border-b border-brand-800/40 flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-2">
          <span className="bg-brand-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
            NIT TRICHY
          </span>
          <span className="font-medium text-slate-200">
            {lang === 'en'
              ? 'Centre for Digital Infrastructure • Order-to-Audit Food Manufacturing System'
              : 'டிஜிட்டல் உள்கட்டமைப்பு மையம், என்.ஐ.டி திருச்சி • உணவு உற்பத்தி அமைப்பு'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span>Database: SQLite + Prisma ORM</span>
          <span>•</span>
          <span>GSTIN: {FACTORY_INFO.gstin}</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white leading-tight">
                {lang === 'en' ? FACTORY_INFO.name : FACTORY_INFO.nameTamil}
              </h1>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-brand-400 px-2 py-0.5 rounded border border-slate-700">
                Prisma SQL
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {lang === 'en' ? 'Packaged South Indian Snacks Division • Thuvakudi' : 'தென்னிந்திய சிற்றுண்டி தயாரிப்பு பிரிவு'}
            </p>
          </div>
        </div>

        {/* Global Controls: Benchmark Runner, User Info, Language, Reset & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Session Info Pill */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <User className="w-3.5 h-3.5 text-brand-400" />
              <div className="text-left font-mono leading-tight">
                <div className="text-white font-semibold text-[11px] truncate max-w-[130px]">{currentUser.name.split(' ')[0]}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold text-brand-300">{currentUser.role}</div>
              </div>
            </div>
          )}

          {/* NIT Benchmark Interactive Walkthrough Trigger */}
          <button
            onClick={onOpenBenchmark}
            className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition-all hover:scale-102"
            title="Open Interactive NIT Tiruchirappalli Benchmark Runner"
          >
            <PlayCircle className="w-4 h-4 text-brand-200 animate-pulse" />
            <span className="hidden md:inline font-mono">BENCHMARK DEMO</span>
            <span className="md:hidden">BENCHMARK</span>
          </button>

          {/* Reset Baseline Button */}
          <button
            onClick={resetToBenchmarkBaseline}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Reset to Opening Baseline (flour 100kg, oil 30L, pouches 500, murukku 50 pkts)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline text-[11px]">Reset DB</span>
          </button>

          {/* Language Toggle (English / Tamil) */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Switch Language: English / தமிழ்"
          >
            <Languages className="w-4 h-4 text-brand-400" />
            <span className="font-semibold">{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 relative"
              title="System Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">System Activity Log</span>
                  <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                        <span className="flex items-center gap-1">
                          {n.type === 'SUCCESS' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {n.type === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                          {n.title}
                        </span>
                        <span className="text-slate-500 text-[10px]">{new Date(n.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          {currentUser && (
            <button
              onClick={logout}
              className="bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Based RBAC Session Switcher */}
      <div className="bg-slate-950/80 border-t border-slate-800/60 px-4 py-1.5 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mr-1 hidden md:inline">
          {lang === 'en' ? 'RBAC Role Session:' : 'பயனர் பங்கு:'}
        </span>
        {roles.map((r) => {
          const isActive = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? `${r.color} text-white shadow-md font-semibold scale-102`
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {r.icon}
              <span>{lang === 'en' ? r.label : r.labelTa}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
          );
        })}
      </div>
    </header>
  );
};
