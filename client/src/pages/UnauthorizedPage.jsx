import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage = () => {
  return (
    <div className="py-12 text-center space-y-4 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-black text-slate-900">403 — Unauthorized Access</h1>
      <p className="text-xs text-slate-500">
        Your current user role does not have authorization to view or manage this portal page. Backend RBAC policies strictly enforce permission boundaries.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Authorized Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
