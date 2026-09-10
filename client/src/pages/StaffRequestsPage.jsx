import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, ChevronRight, Eye, Check } from 'lucide-react';

export const StaffRequestsPage = () => {
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
      console.error('Failed to load department requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      await API.post(`/requests/${id}/approve`, {
        comments: `Approved by ${user.name} (${user.role}) from Staff Portal`,
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Department Queue</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading department requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No requests currently in department queue.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Req Number</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Workflow & Title</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned Officer</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition">
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
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">
                        {req.assignedTo?.name ? req.assignedTo.name : 'Department Desk'}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {!['APPROVED', 'COMPLETED', 'REJECTED'].includes(req.status) && (
                        <button
                          onClick={() => handleApprove(req._id)}
                          disabled={processing}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition"
                        >
                          Approve
                        </button>
                      )}
                      <Link
                        to={`/staff/requests/${req._id}`}
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
