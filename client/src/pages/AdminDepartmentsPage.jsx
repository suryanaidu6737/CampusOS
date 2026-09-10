import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Building2, Plus, ShieldCheck } from 'lucide-react';

export const AdminDepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
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
    fetchDepts();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">University Department Directory</h1>
          <p className="text-xs text-slate-500">Registered academic and administrative departments</p>
        </div>
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
    </div>
  );
};
