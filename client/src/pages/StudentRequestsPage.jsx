import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, Search, Filter } from 'lucide-react';

export const StudentRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredRequests = requests.filter(
    (r) =>
      r.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.departmentId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Campus Workflows & Requests</h1>
          <p className="text-xs text-slate-500">Track and monitor all your submitted natural-language requests</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search request # or title..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading request history...</p>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No requests found</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Req Number</th>
                  <th className="py-3 px-3">Workflow & Title</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Assigned Personnel</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Submitted</th>
                  <th className="py-3 px-3 text-right">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-brand-700">{req.requestNumber}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{req.title}</p>
                      <p className="text-[10px] text-slate-400">{req.workflowId?.name}</p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{req.departmentId?.name}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">
                        {req.assignedTo?.name ? req.assignedTo.name : 'Department Review Desk'}
                      </p>
                      <p className="text-[10px] text-brand-700 font-medium">
                        {req.assignedTo?.role ? `${req.assignedTo.role}` : 'Central Queue'}
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
                        to={`/student/requests/${req._id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800"
                      >
                        <span>View Details</span>
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
