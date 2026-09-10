import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { Check, Eye, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HODApprovalsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await API.get('/requests');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to load HOD approvals queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const pendingApprovals = requests.filter((r) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_INFO', 'FACULTY_REVIEW', 'HOD_APPROVAL', 'DEPARTMENT_REVIEW', 'ESCALATED'].includes(r.status)
  );

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      await API.post(`/requests/${id}/approve`, {
        comments: `HOD Executive Approval granted by ${user.name}`,
      });
      await fetchQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">HOD Approval Queue</h1>
        <p className="text-xs text-slate-500">Executive approval decisions for {user?.department?.name || 'Department'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading approval queue...</p>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-700">No pending HOD approvals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Req Number</th>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Workflow & Title</th>
                  <th className="py-3 px-3">Assigned Officer</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Approval Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingApprovals.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-brand-700">{req.requestNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{req.userId?.name}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{req.title}</p>
                      <p className="text-[10px] text-slate-400">{req.workflowId?.name}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{req.assignedTo?.name || 'Department Desk'}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(req._id)}
                        disabled={processing}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <Link
                        to={`/hod/requests/${req._id}`}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Details</span>
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
