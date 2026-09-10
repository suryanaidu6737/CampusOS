import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { GitMerge, Layers, Shield } from 'lucide-react';

export const AdminWorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWf = async () => {
      try {
        const res = await API.get('/workflows');
        if (res.data.success) {
          setWorkflows(res.data.workflows);
        }
      } catch (err) {
        console.error('Failed to load workflows', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWf();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Active Workflow Templates Engine</h1>
        <p className="text-xs text-slate-500">Configured multi-step approval workflows and role routing blueprints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <p className="text-xs text-slate-400 py-8 col-span-2 text-center">Loading workflow configurations...</p>
        ) : (
          workflows.map((wf) => (
            <div key={wf._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-brand-600 uppercase">{wf.category}</span>
                  <h3 className="text-base font-extrabold text-slate-900">{wf.name}</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {wf.key}
                </span>
              </div>

              <p className="text-xs text-slate-600">{wf.description}</p>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Workflow Pipeline Steps:</p>
                <div className="space-y-1.5">
                  {wf.steps?.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {step.label}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                        Required Role: {step.roleRequired}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
