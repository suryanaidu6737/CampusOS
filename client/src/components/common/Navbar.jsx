import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Bell, LogOut, Cpu, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPortalLabel = () => {
    if (location.pathname.startsWith('/admin')) return 'Admin Portal';
    if (location.pathname.startsWith('/hod')) return 'HOD Portal';
    if (location.pathname.startsWith('/staff')) return 'Staff & Faculty Portal';
    if (location.pathname.startsWith('/student')) return 'Student Portal';
    
    switch (user?.role) {
      case 'ADMIN': return 'Admin Portal';
      case 'HOD': return 'HOD Portal';
      case 'STAFF':
      case 'FACULTY': return 'Staff & Faculty Portal';
      default: return 'Student Portal';
    }
  };

  const getNotificationsPath = () => {
    if (user?.role === 'ADMIN') return '/admin/audit-logs';
    if (user?.role === 'HOD') return '/hod/notifications';
    if (user?.role === 'STAFF' || user?.role === 'FACULTY') return '/staff/notifications';
    return '/student/notifications';
  };

  const getProfilePath = () => {
    if (user?.role === 'ADMIN') return '/admin/settings';
    if (user?.role === 'HOD') return '/hod/profile';
    if (user?.role === 'STAFF' || user?.role === 'FACULTY') return '/staff/profile';
    return '/student/profile';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">CampusOS</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200">
                {getPortalLabel()}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">ENTERPRISE UNIVERSITY PLATFORM</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Link */}
        <Link to={getNotificationsPath()} className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition" title="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full" />
        </Link>

        {/* User Account Info */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <Link to={getProfilePath()} className="flex items-center gap-2.5 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name?.slice(0, 2) || 'US'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">
                <span className="font-bold text-brand-700">{user?.role}</span> • {user?.department?.name || 'Central Campus'}
              </p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

