import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ArrowUpRight,
  Eye,
  Building2,
  Sparkles,
  Filter,
  UserCheck,
  Check,
  Zap,
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionComments, setActionComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | ALL | COMPLETED | ESCALATED

  const fetchQueue = async () => {
    try {
      const res = await API.get('/requests');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to load queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDirectAction = async (requestId, actionType, customComment = '') => {
    setProcessing(true);
    try {
      let endpoint = `/requests/${requestId}/${actionType}`;
      await API.post(endpoint, {
        comments: customComment || actionComments || `${actionType.toUpperCase()} decision submitted by ${user.name} (${user.role})`,
      });
      setSelectedReq(null);
      setActionComments('');
      await fetchQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process request action');
    } finally {
      setProcessing(false);
    }
  };

  const pendingRequests = requests.filter((r) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_INFO', 'FACULTY_REVIEW', 'DEPARTMENT_REVIEW'].includes(r.status)
  );

  const completedRequests = requests.filter((r) => ['APPROVED', 'COMPLETED'].includes(r.status));
  const escalatedRequests = requests.filter((r) => r.status === 'ESCALATED');

  const displayedRequests =
    activeTab === 'PENDING'
      ? pendingRequests
      : activeTab === 'COMPLETED'
      ? completedRequests
      : activeTab === 'ESCALATED'
      ? escalatedRequests
      : requests;

  const roleTitle =
    user?.role === 'FACULTY'
      ? 'Faculty Advisor Review & Approval Portal'
      : user?.role === 'HOD'
      ? 'HOD Executive Approval Portal'
      : 'Department Staff Review Queue';

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono text-[11px] font-bold border border-brand-500/30">
              Role: {user?.role}
            </span>
            <span className="text-slate-300 text-xs font-semibold">• Dept: {user?.department?.name || 'Central Campus'}</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight">{roleTitle}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Authorized portal for reviewing, approving, rejecting, or escalating campus workflow requests.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10"
        >
          Refresh Queue
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Queue</p>
          <p className="text-xl font-black text-slate-900">{requests.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/30 shadow-sm">
          <p className="text-[10px] font-bold text-amber-700 uppercase">Pending Approval</p>
          <p className="text-xl font-black text-amber-600">{pendingRequests.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-700 uppercase">Approved / Done</p>
          <p className="text-xl font-black text-emerald-600">{completedRequests.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/30 shadow-sm">
          <p className="text-[10px] font-bold text-rose-700 uppercase">Escalated</p>
          <p className="text-xl font-black text-rose-600">{escalatedRequests.length}</p>
        </div>
      </div>

      {/* PROMINENT PENDING APPROVALS SECTION */}
      <div className="bg-white rounded-2xl border-2 border-brand-500/30 shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {user?.role === 'FACULTY' ? 'Pending Faculty Approval Requests' : 'Requests Awaiting Approval'}
              </h2>
              <p className="text-xs text-slate-500">Requires your review and approval decision</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-mono">
            {pendingRequests.length} Pending Action
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading pending approvals...</p>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-700">All requests in your queue are processed!</p>
            <p className="text-[11px] text-slate-400">No pending approvals required right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div key={req._id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-700">{req.requestNumber}</span>
                    <h3 className="text-sm font-extrabold text-slate-900">{req.title}</h3>
                    <p className="text-[11px] text-slate-500">Student: <strong>{req.userId?.name}</strong> ({req.userId?.studentId || 'N/A'})</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200/80 text-xs space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Student Description</p>
                  <p className="font-medium text-slate-700 italic">"{req.description}"</p>
                </div>

                {/* Direct Action Buttons Row */}
                <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                  <button
                    onClick={() => setSelectedReq(req)}
                    className="text-xs text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View AI Details</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDirectAction(req._id, 'reject', 'Rejected by authority')}
                      disabled={processing}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleDirectAction(req._id, 'approve', `Approved by ${user?.name} (${user?.role})`)}
                      disabled={processing}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Request</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Request Table with Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-slate-900">All Department Queue Requests</h3>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'PENDING', label: `Pending (${pendingRequests.length})` },
              { id: 'COMPLETED', label: `Completed (${completedRequests.length})` },
              { id: 'ESCALATED', label: `Escalated (${escalatedRequests.length})` },
              { id: 'ALL', label: `All (${requests.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {displayedRequests.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No requests matching filter '{activeTab}'.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Req Number</th>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Request Title</th>
                  <th className="py-3 px-3">Department & Assigned Officer</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-brand-700">{req.requestNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {req.userId?.name || 'Student'}
                      <p className="text-[10px] text-slate-400 font-normal">{req.userId?.studentId || 'N/A'}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{req.title}</p>
                      <p className="text-[10px] text-slate-400">{req.workflowId?.name}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{req.departmentId?.name}</p>
                      <p className="text-[10px] font-semibold text-brand-700">
                        Assigned: {req.assignedTo?.name ? `${req.assignedTo.name} (${req.assignedTo.role})` : 'Department Desk'}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      {['APPROVED', 'COMPLETED', 'REJECTED'].includes(req.status) ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          Processed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDirectAction(req._id, 'approve', `Approved by ${user?.name}`)}
                          disabled={processing}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-brand-600 uppercase">Reviewing Request</span>
                <h3 className="text-lg font-black text-slate-900">{selectedReq.requestNumber} — {selectedReq.title}</h3>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-slate-700 font-bold p-1">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Student Name</p>
                <p className="font-bold text-slate-800">{selectedReq.userId?.name}</p>
                <p className="text-[10px] text-slate-500">{selectedReq.userId?.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Student ID & Dept</p>
                <p className="font-bold text-slate-800">{selectedReq.userId?.studentId || 'N/A'}</p>
                <p className="text-[10px] text-slate-500">{selectedReq.departmentId?.name}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Natural Language Description</p>
                <p className="font-medium text-slate-700 mt-0.5">"{selectedReq.description}"</p>
              </div>
            </div>

            <div className="bg-brand-50/60 rounded-xl p-4 border border-brand-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-brand-800 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>AI Extracted Workflow Metadata</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block">Category</span>
                  <span className="font-bold text-slate-900">{selectedReq.workflowId?.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Step</span>
                  <span className="font-bold text-brand-700">{selectedReq.currentStep}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Status</span>
                  <StatusBadge status={selectedReq.status} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Comments / Remarks</label>
              <textarea
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                rows={2}
                placeholder="Enter remarks..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleDirectAction(selectedReq._id, 'request-info')}
                disabled={processing}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 transition"
              >
                Request Info
              </button>
              <button
                onClick={() => handleDirectAction(selectedReq._id, 'escalate')}
                disabled={processing}
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs border border-purple-300 transition"
              >
                Escalate
              </button>
              <button
                onClick={() => handleDirectAction(selectedReq._id, 'reject')}
                disabled={processing}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm"
              >
                Reject
              </button>
              <button
                onClick={() => handleDirectAction(selectedReq._id, 'approve')}
                disabled={processing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md shadow-emerald-600/20"
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
