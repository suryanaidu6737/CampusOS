import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Bot,
  FileText,
  ClipboardList,
  CheckCircle2,
  Bell,
  Settings,
  PieChart,
  Users,
  GitMerge,
  Building2,
  User,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  const navItems = [];

  if (role === 'STUDENT') {
    navItems.push(
      { label: 'Student Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
      { label: 'AI Request Assistant', icon: Bot, path: '/student/assistant' },
      { label: 'My Requests', icon: FileText, path: '/student/requests' },
      { label: 'Notifications', icon: Bell, path: '/student/notifications' },
      { label: 'My Profile', icon: User, path: '/student/profile' }
    );
  } else if (role === 'STAFF' || role === 'FACULTY') {
    navItems.push(
      { label: role === 'FACULTY' ? 'Faculty Portal' : 'Staff Portal', icon: LayoutDashboard, path: '/staff/dashboard' },
      { label: 'Department Queue', icon: ClipboardList, path: '/staff/requests' },
      { label: 'Notifications', icon: Bell, path: '/staff/notifications' },
      { label: 'Staff Profile', icon: User, path: '/staff/profile' }
    );
  } else if (role === 'HOD') {
    navItems.push(
      { label: 'HOD Department Portal', icon: LayoutDashboard, path: '/hod/dashboard' },
      { label: 'Department Requests', icon: Layers, path: '/hod/requests' },
      { label: 'Pending Approvals', icon: ClipboardList, path: '/hod/approvals' },
      { label: 'Department Analytics', icon: PieChart, path: '/hod/analytics' },
      { label: 'Notifications', icon: Bell, path: '/hod/notifications' },
      { label: 'HOD Profile', icon: User, path: '/hod/profile' }
    );
  } else if (role === 'ADMIN') {
    navItems.push(
      { label: 'Overview Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { label: 'User Directory', icon: Users, path: '/admin/users' },
      { label: 'Departments', icon: Building2, path: '/admin/departments' },
      { label: 'Workflows', icon: GitMerge, path: '/admin/workflows' },
      { label: 'System Requests', icon: Layers, path: '/admin/requests' },
      { label: 'Audit Logs & Analytics', icon: Activity, path: '/admin/audit-logs' },
      { label: 'System Settings', icon: Settings, path: '/admin/settings' }
    );
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-61px)] p-4 flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 py-1 mb-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Portal Mode</span>
            <span className="text-[10px] font-extrabold text-brand-400 font-mono">{role}</span>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 font-bold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

      </div>

      <div className="pt-4 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-400 font-bold">CampusOS</p>
      </div>
    </aside>
  );
};

