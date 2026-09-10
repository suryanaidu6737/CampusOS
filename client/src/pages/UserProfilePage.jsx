import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Mail, Building2, CreditCard, Award } from 'lucide-react';


export const UserProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Profile & Credentials</h1>
        <p className="text-xs text-slate-500">Authenticated user details and backend authorization profile</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">
            {user?.name?.slice(0, 2) || 'US'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.designation || 'University Member'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
              <Mail className="w-3.5 h-3.5" />
              <span>Campus Email</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{user?.email}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
              <Building2 className="w-3.5 h-3.5" />
              <span>Department</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{user?.department?.name || 'Central Campus'}</p>
          </div>

          {user?.studentId && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Student ID</span>

              </div>
              <p className="font-mono font-black text-brand-700 text-sm">{user.studentId}</p>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authentication Status</span>
            </div>
            <p className="font-bold text-emerald-600 text-sm">Verified Backend JWT Session</p>
          </div>
        </div>
      </div>
    </div>
  );
};
