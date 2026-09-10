import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { GitMerge, Layers, Shield, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

export const AdminWorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchWf = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchWf();
  }, []);

  const handleToggle = async (id) => {
    try {
      setTogglingId(id);
      const res = await API.patch(`/workflows/${id}/toggle`);
      if (res.data.success) {
        fetchWf();
      }
    } catch (err) {
      console.error('Failed to toggle workflow status', err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workflows</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <p className="text-xs text-slate-400 py-8 col-span-2 text-center">Loading workflow configurations...</p>
        ) : (
          workflows.map((wf) => {
            const isActive = wf.active !== false;

            return (
              <div key={wf._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-600 uppercase">{wf.category}</span>
                    <h3 className="text-base font-extrabold text-slate-900">{wf.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {wf.key}
                    </span>
                    <button
                      onClick={() => handleToggle(wf._id)}
                      disabled={togglingId === wf._id}
                      className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition inline-flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </div>
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
            );
          })
        )}
      </div>
    </div>
  );
};

