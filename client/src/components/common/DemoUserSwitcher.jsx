import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_ACCOUNTS } from '../../utils/constants';
import { ChevronDown, Sparkles, ShieldAlert } from 'lucide-react';

export const DemoUserSwitcher = () => {
  const { user, login } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSwitch = async (account) => {
    setOpen(false);
    await login(account.email, 'password123');
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 hover:bg-amber-500/20 text-xs font-semibold transition"
        title="DEMO MODE: Authenticates as selected user via JWT login endpoint"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span className="font-bold text-[11px] uppercase tracking-wider text-amber-800">[DEMO MODE]</span>
        <span className="text-slate-600">Active: <strong>{user?.name}</strong> ({user?.role})</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
          <div className="px-3 py-2 border-b border-slate-100 mb-1 bg-amber-50/50">
            <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>HACKATHON DEMO AUTH SWITCHER</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Re-authenticates via backend JWT endpoint as selected demo identity:
            </p>
          </div>
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              onClick={() => handleSwitch(acc)}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                user?.email === acc.email ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700'
              }`}
            >
              <div>
                <p className="font-bold text-slate-800">{acc.name}</p>
                <p className="text-[10px] text-slate-400">{acc.email}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600 font-bold">
                {acc.role}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
