import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Building2, Plus, ShieldCheck, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminDepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDepts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newDept.name || !newDept.code) {
      setErrorMsg('Department Name and Code are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/departments', newDept);
      if (res.data.success) {
        setSuccessMsg(`✓ Department '${res.data.department.name}' created successfully.`);
        setTimeout(() => {
          setIsModalOpen(false);
          setNewDept({ name: '', code: '', description: '' });
          setSuccessMsg('');
          fetchDepts();
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Departments</h1>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-8 col-span-3 text-center">Loading departments...</p>
        ) : (
          departments.map((d) => (
            <div key={d._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  CODE: {d.code}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{d.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{d.description || 'University Department'}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                <span className="text-xs font-bold text-emerald-600">Active Department</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 border border-brand-100">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Add New Department</h2>
                <p className="text-xs text-slate-500 font-medium">Create a university academic/administrative department</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief description of department scope..."
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

