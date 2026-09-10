import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Building2,
  Users,
  GitMerge,
  PieChart,
  ShieldCheck,
  Activity,
  Layers,
  GraduationCap,
  Briefcase,
  UserCheck,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [resAnalytics, resWf, resDept] = await Promise.all([
          API.get('/analytics/dashboard'),
          API.get('/workflows'),
          API.get('/departments'),
        ]);
        setStats(resAnalytics.data.stats);
        setWorkflows(resWf.data.workflows || []);
        setDepartments(resDept.data.departments || []);
        setRecentActivity(resAnalytics.data.recentActivity || []);
        setRecentRequests(resAnalytics.data.recentRequests || []);
      } catch (err) {
        console.error('Failed to load admin analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono text-[11px] font-bold border border-brand-500/30">
              System Admin Console
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 p-3 rounded-2xl border border-slate-700">
          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Avg Resolution Time</p>
            <p className="text-sm font-bold text-white">{stats?.avgResolutionTime || '1.4 hours'}</p>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Students</p>
            <p className="text-xl font-extrabold text-slate-900">{stats?.totalStudents || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Faculty</p>
            <p className="text-xl font-extrabold text-slate-900">{stats?.totalFaculty || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Staff</p>
            <p className="text-xl font-extrabold text-slate-900">{stats?.totalStaff || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total HODs</p>
            <p className="text-xl font-extrabold text-slate-900">{stats?.totalHODs || 0}</p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Requests</p>
            <p className="text-xl font-extrabold text-slate-900">{stats?.pendingRequests || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Active Workflows</p>
            <p className="text-xl font-extrabold text-slate-900">
              {stats?.activeWorkflows || 0} / {stats?.totalWorkflows || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Activations</p>
            <p className="text-xl font-extrabold text-slate-900">{stats?.pendingActivations || 0}</p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Activity Audit Feed & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-extrabold text-slate-900">Administrative Audit Feed</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Latest Actions</span>
          </div>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent audit log activity found.</p>
            ) : (
              recentActivity.map((log) => (
                <div key={log._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between text-xs gap-3">
                  <div>
                    <span className="font-bold text-slate-900 block">{log.action}</span>
                    <p className="text-[11px] text-slate-500">
                      User: {log.userId?.name || 'System'} ({log.userId?.email || 'N/A'})
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent College Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-extrabold text-slate-900">Recent College Requests</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Live Submissions</span>
          </div>

          <div className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent requests found.</p>
            ) : (
              recentRequests.map((req) => (
                <div key={req._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{req.title || req.category}</p>
                    <p className="text-[11px] text-slate-500">
                      Student: {req.studentId?.name || 'Student'} ({req.studentId?.studentId || 'N/A'})
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Workflow Configuration Engine */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-extrabold text-slate-900">Active Workflow Templates Engine</h3>
          </div>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {workflows.length} Core Workflows Loaded
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <div key={wf._id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">{wf.name}</h4>
                <span className="text-[10px] font-mono font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                  {wf.key}
                </span>
              </div>
              <p className="text-xs text-slate-600">{wf.description}</p>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Workflow Steps Pipeline:</p>
                <div className="flex flex-wrap gap-1.5">
                  {wf.steps?.map((st, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">
                      {i + 1}. {st.label} ({st.roleRequired})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departments Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-600" />
          <h3 className="text-base font-extrabold text-slate-900">University Department Directory</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {departments.map((d) => (
            <div key={d._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">{d.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">Code: {d.code}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

