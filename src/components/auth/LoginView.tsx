import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Factory,
  BarChart3,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { FACTORY_INFO } from '../../data/seedData';

export const LoginView: React.FC = () => {
  const { login, lang } = useErp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'Salesman A',
      email: 'salesman_a@annamfoods.co.in',
      pass: 'salesman123',
      icon: <Smartphone className="w-3.5 h-3.5" />,
      color: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
    },
    {
      role: 'Factory Admin',
      email: 'admin@annamfoods.co.in',
      pass: 'admin123',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      color: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
    },
    {
      role: 'Production Floor',
      email: 'production@annamfoods.co.in',
      pass: 'prod123',
      icon: <Factory className="w-3.5 h-3.5" />,
      color: 'bg-amber-600/20 text-amber-300 border-amber-500/40',
    },
    {
      role: 'Auditor & Accounts',
      email: 'auditor@annamfoods.co.in',
      pass: 'auditor123',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      color: 'bg-purple-600/20 text-purple-300 border-purple-500/40',
    },
    {
      role: 'Factory Owner',
      email: 'owner@annamfoods.co.in',
      pass: 'owner123',
      icon: <Crown className="w-3.5 h-3.5" />,
      color: 'bg-brand-600/20 text-brand-300 border-brand-500/40',
    },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Check email and password or use 1-click demo accounts below.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {lang === 'en' ? FACTORY_INFO.name : FACTORY_INFO.nameTamil}
          </h2>
          <p className="text-xs text-slate-400">
            NIT Tiruchirappalli Order-to-Audit Manufacturing System
          </p>
          <div className="inline-block text-[11px] font-mono bg-slate-950 text-slate-400 px-3 py-1 rounded-full border border-slate-800">
            Role-Based Access Control (RBAC) & JWT Security
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@annamfoods.co.in"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-600/30 transition-all hover:scale-101"
          >
            <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter System'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Role Quickfill Buttons for Evaluators */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>NIT Evaluator 1-Click Credentials:</span>
            <span className="font-mono text-brand-400 text-[10px]">Password autofilled</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc.email, acc.pass)}
                className={`p-2 rounded-lg border text-left text-xs flex items-center gap-2 transition-all hover:scale-101 ${acc.color}`}
              >
                {acc.icon}
                <div className="truncate">
                  <div className="font-bold text-[11px] leading-tight">{acc.role}</div>
                  <div className="text-[9px] opacity-75 truncate">{acc.email.split('@')[0]}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

