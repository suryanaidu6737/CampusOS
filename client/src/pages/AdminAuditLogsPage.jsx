import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, FileText, ChevronRight } from 'lucide-react';

export const AdminAuditLogsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminRequests = async () => {
      try {
        const res = await API.get('/requests');
        if (res.data.success) {
          setRequests(res.data.requests);
        }
      } catch (err) {
        console.error('Failed to load system-wide requests log', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminRequests();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Logs & Requests Registry</h1>
        <p className="text-xs text-slate-500">System-wide persistent logs of all university workflow executions</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading system request logs...</p>
        ) : requests.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No system requests found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Req Number</th>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Workflow</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Assigned Personnel</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-brand-700">{req.requestNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{req.userId?.name}</td>
                    <td className="py-3 px-3">{req.workflowId?.name}</td>
                    <td className="py-3 px-3 text-slate-700">{req.departmentId?.name}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {req.assignedTo?.name ? `${req.assignedTo.name} (${req.assignedTo.role})` : 'Department Desk'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/admin/requests/${req._id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                      >
                        <span>View Audit Trail</span>
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
