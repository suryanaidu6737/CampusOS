import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  ChevronRight,
  Eye,
  Check,
  XCircle,
  Sparkles,
} from 'lucide-react';

export const HODDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchDepartmentRequests = async () => {
    try {
      const res = await API.get('/requests');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to load HOD department requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentRequests();
  }, []);

  const handleHODApprove = async (requestId) => {
    setProcessing(true);
    try {
      await API.post(`/requests/${requestId}/approve`, {
        comments: `HOD Executive Approval granted by ${user.name} (HOD - ${user?.department?.name || 'Department'})`,
      });
      await fetchDepartmentRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'HOD approval failed');
    } finally {
      setProcessing(false);
    }
  };

  const pendingApprovals = requests.filter((r) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_INFO', 'FACULTY_REVIEW', 'HOD_APPROVAL', 'DEPARTMENT_REVIEW'].includes(r.status)
  );
  const escalatedRequests = requests.filter((r) => r.status === 'ESCALATED');
  const completedRequests = requests.filter((r) => ['APPROVED', 'COMPLETED'].includes(r.status));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono text-[11px] font-bold border border-brand-500/30">
              Executive HOD Console
            </span>
            <span className="text-slate-300 text-xs font-semibold">• Dept: {user?.department?.name || 'Computer Science & Engineering'}</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Department oversight, executive workflow approvals, and department-level operational metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-2xl border border-white/10">
          <Building2 className="w-5 h-5 text-brand-400" />
          <div>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Department Code</p>
            <p className="text-xs font-mono font-bold text-white">{user?.department?.code || 'CSE'}</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Dept Requests</p>
          <p className="text-xl font-black text-slate-900">{requests.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/30 shadow-sm">
          <p className="text-[10px] font-bold text-amber-700 uppercase">Pending Approvals</p>
          <p className="text-xl font-black text-amber-600">{pendingApprovals.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-700 uppercase">Approved / Done</p>
          <p className="text-xl font-black text-emerald-600">{completedRequests.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-orange-200 bg-orange-50/30 shadow-sm">
          <p className="text-[10px] font-bold text-orange-700 uppercase">Escalated to HOD</p>
          <p className="text-xl font-black text-orange-600">{escalatedRequests.length}</p>
        </div>
      </div>

      {/* PENDING APPROVALS QUEUE FOR HOD */}
      <div className="bg-white rounded-2xl border-2 border-brand-500/30 shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-600/20">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Department Pending Approvals</h2>
              <p className="text-xs text-slate-500">Requests requiring HOD decision or department sign-off</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-100 text-brand-800 border border-brand-300 font-mono">
            {pendingApprovals.length} Pending
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading department approval queue...</p>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-700">No pending approvals for your department!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((req) => (
              <div key={req._id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-700">{req.requestNumber}</span>
                    <h3 className="text-sm font-extrabold text-slate-900">{req.title}</h3>
                    <p className="text-[11px] text-slate-500">
                      Student: <strong>{req.userId?.name}</strong> ({req.userId?.studentId || 'STU-2026'})
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Personnel</p>
                  <p className="font-bold text-slate-800">
                    {req.assignedTo?.name ? `${req.assignedTo.name} (${req.assignedTo.role})` : 'Department Review Desk'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <Link
                    to={`/hod/requests/${req._id}`}
                    className="text-xs text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Timeline</span>
                  </Link>

                  <button
                    onClick={() => handleHODApprove(req._id)}
                    disabled={processing}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>HOD Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Department Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">All Department Requests Overview</h3>

        {requests.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No department requests recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Req Number</th>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Workflow Name</th>
                  <th className="py-3 px-3">Assigned Officer</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-brand-700">{req.requestNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{req.userId?.name}</td>
                    <td className="py-3 px-3">{req.workflowId?.name}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {req.assignedTo?.name ? req.assignedTo.name : 'Department Desk'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/hod/requests/${req._id}`}
                        className="text-xs font-bold text-brand-600 hover:underline"
                      >
                        Details
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
