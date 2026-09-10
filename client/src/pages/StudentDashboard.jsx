import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { AIAssistant } from '../components/student/AIAssistant';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  TrendingUp,
  FolderKanban,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await API.get('/requests');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to load student requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const stats = {
    total: requests.length,
    inProgress: requests.filter((r) => ['SUBMITTED', 'PENDING_INFO', 'UNDER_REVIEW'].includes(r.status)).length,
    completed: requests.filter((r) => r.status === 'COMPLETED' || r.status === 'APPROVED').length,
    pendingAction: requests.filter((r) => r.status === 'PENDING_INFO').length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono text-[11px] font-bold border border-brand-500/30">
              Student ID: {user?.studentId || 'STU-2026-001'}
            </span>
            <span className="text-slate-400 text-xs">• {user?.department?.name}</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2.5 rounded-2xl border border-white/10">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <div className="text-right">
            <p className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">AI Workflow Agent</p>
            <p className="text-xs font-semibold text-emerald-400">System Ready & Active</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Requests</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">In Progress</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.inProgress}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Approved / Done</p>
            <p className="text-xl font-extrabold text-emerald-600">{stats.completed}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Action</p>
            <p className="text-xl font-extrabold text-amber-600">{stats.pendingAction}</p>
          </div>
        </div>
      </div>

      {/* Main AI Assistant Section */}
      <AIAssistant onRequestCreated={fetchRequests} />

      {/* Active Requests List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">My Active Campus Workflows</h3>
            <p className="text-xs text-slate-500">Track real-time status and department routing history</p>
          </div>
          <button onClick={fetchRequests} className="text-xs text-brand-600 hover:underline font-bold">
            Refresh List
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No requests submitted yet.</p>
            <p className="text-[11px] text-slate-400">Use the AI Assistant above to create your first request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Req Number</th>
                  <th className="py-3 px-3">Title & Category</th>
                  <th className="py-3 px-3">Department & Officer</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Submitted</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-brand-700">{req.requestNumber}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{req.title}</p>
                      <p className="text-[10px] text-slate-400">{req.workflowId?.name || 'Standard Workflow'}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{req.departmentId?.name || 'Student Section'}</p>
                      <p className="text-[10px] text-brand-700 font-semibold">
                        Assigned to: {req.assignedTo?.name ? `${req.assignedTo.name} (${req.assignedTo.role})` : 'Department Desk'}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/requests/${req._id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800"
                      >
                        <span>View Timeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
