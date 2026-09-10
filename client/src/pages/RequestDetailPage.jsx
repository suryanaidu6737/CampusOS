import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { Timeline } from '../components/common/Timeline';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  UserCheck,
  History,
  Building2,
} from 'lucide-react';

export const RequestDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequestDetails = async () => {
    try {
      const res = await API.get(`/requests/${id}`);
      if (res.data.success) {
        setRequest(res.data.request);
        setAuditLogs(res.data.auditLogs);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading workflow details...</div>;
  }

  if (error || !request) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs max-w-md mx-auto">
          {error || 'Request not found'}
        </div>
        <Link to="/" className="text-xs text-brand-600 font-bold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const steps = request.workflowId?.steps || [];
  const currentStepIndex = request.currentStepIndex || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} />
          <span className="text-xs font-mono font-bold text-slate-500">{request.requestNumber}</span>
        </div>
      </div>

      {/* Main Request Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{request.workflowId?.name}</span>
            <h1 className="text-xl font-black text-slate-900 mt-0.5">{request.title}</h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold block">Responsible Department</span>
            <span className="text-xs font-bold text-slate-800">{request.departmentId?.name}</span>
          </div>
        </div>

        {/* Visual Workflow Timeline */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Workflow Progression Timeline</h3>
          <Timeline
            steps={steps}
            currentStepIndex={currentStepIndex}
            status={request.status}
            history={request.history}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 columns: Request details & AI parameters */}
        <div className="md:col-span-2 space-y-6">
          {/* Natural Language Prompt */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Original Request Prompt</span>
            </h3>
            <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed font-medium">
              "{request.description}"
            </p>
          </div>

          {/* AI Extracted Parameters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>AI Agent Extracted Parameters</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs bg-brand-50/50 p-4 rounded-xl border border-brand-200/80">
              {Object.entries(request.extractedData || {}).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{key}</p>
                  <p className="font-semibold text-slate-800">{String(val)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit History Log */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-brand-600" />
              <span>Transition History & Audit Trail</span>
            </h3>

            <div className="space-y-3">
              {request.history?.map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-800">{h.step}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(h.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{h.comments}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                      By: <strong className="text-slate-700">{h.performedBy?.name || 'System / Auto'}</strong> ({h.performedBy?.role || 'SYSTEM'})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Student info & Assigned Officer details */}
        <div className="space-y-6">
          {/* ASSIGNED OFFICER CARD (BUG 1 Requirement) */}
          <div className="bg-white rounded-2xl p-6 border-2 border-brand-500/20 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-brand-700 font-extrabold text-xs uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-brand-600" />
              <span>Assigned Personnel</span>
            </div>

            {request.assignedTo ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned To</p>
                  <p className="font-black text-slate-900 text-sm">{request.assignedTo.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Designation / Role</p>
                  <p className="font-bold text-brand-700">{request.assignedTo.role}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Department</p>
                  <p className="font-semibold text-slate-700">
                    {request.assignedTo.departmentId?.name || request.departmentId?.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Department</p>
                <p className="font-bold text-slate-900">{request.departmentId?.name}</p>
                <p className="text-[10px] text-slate-500">Processing by Department Review Desk</p>
              </div>
            )}
          </div>

          {/* Student Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Student Profile</h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Name</p>
                <p className="font-bold text-slate-900">{request.userId?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Student ID</p>
                <p className="font-mono font-bold text-brand-700">{request.userId?.studentId || 'STU-2026-001'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Department</p>
                <p className="font-medium text-slate-700">{request.userId?.departmentId?.name || request.departmentId?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
