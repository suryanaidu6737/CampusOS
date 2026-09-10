import React, { useState } from 'react';
import API from '../../services/api';
import { Bot, Send, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Clock, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIAssistant = ({ onRequestCreated }) => {
  const [promptText, setPromptText] = useState('I need a bonafide certificate for my internship.');
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!promptText.trim()) return;
    setAnalyzing(true);
    setError('');
    setAiResult(null);

    try {
      const res = await API.post('/ai/analyze-request', { promptText });
      if (res.data.success) {
        setAiResult(res.data.analysis);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitWorkflow = async () => {
    if (!aiResult) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        workflowKey: aiResult.workflow_key,
        title: aiResult.title,
        description: promptText,
        extractedData: aiResult.extractedData,
        priority: aiResult.priority,
      };

      const res = await API.post('/requests', payload);
      if (res.data.success) {
        if (onRequestCreated) onRequestCreated(res.data.request);
        navigate(`/requests/${res.data.request._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit workflow request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            AI Campus Assistant
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Agentic Orchestrator
            </span>
          </h2>
          <p className="text-xs text-slate-500">Describe your request in natural language. CampusOS AI handles parsing, routing, and tracking.</p>
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleAnalyze} className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">How can CampusOS help you today?</label>
        <div className="relative">
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            placeholder="e.g. 'I need a bonafide certificate for my internship.' or 'I need 2 days leave for medical reasons.'"
            className="w-full rounded-xl border border-slate-300 p-3.5 pr-12 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition shadow-inner"
          />
          <button
            type="submit"
            disabled={analyzing || !promptText.trim()}
            className="absolute right-3 bottom-4 p-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition shadow-sm"
          >
            {analyzing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Quick Demo Prompts:</span>
          {[
            "I lost my ID card and need a new replacement.",
            "I need a bonafide certificate for my internship.",
            "I need 3 days duty leave for hackathon participation.",
            "Water pipe leakage in Hostel Block B room 204.",
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setPromptText(prompt)}
              className="text-[11px] bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700 px-2.5 py-1 rounded-lg transition border border-slate-200"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* AI Agent Reasoning & Output */}
      {aiResult && (
        <div className="space-y-5 bg-slate-50 rounded-xl p-5 border border-slate-200 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">AI Agent Execution Plan</span>
            </div>
            <span className="text-[10px] font-mono bg-brand-100 text-brand-800 px-2.5 py-0.5 rounded-full font-bold">
              Intent: {aiResult.intent}
            </span>
          </div>

          {/* Reasoning Steps Display (Explicit Agent Steps) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiResult.reasoning_steps?.map((step, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <p className="text-xs font-bold text-slate-800">{step.title}</p>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{step.detail}</p>
              </div>
            ))}
          </div>

          {/* Extracted Structured Card */}
          <div className="bg-white rounded-xl p-4 border border-brand-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900">{aiResult.title}</h4>
              <span className="text-xs px-2.5 py-0.5 rounded bg-brand-50 text-brand-700 font-bold border border-brand-200">
                Department: {aiResult.responsible_department_name}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Category</p>
                <p className="font-semibold text-slate-800 capitalize">{aiResult.intent?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Request Type</p>
                <p className="font-semibold text-slate-800 capitalize">{aiResult.request_type}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Extracted Purpose</p>
                <p className="font-semibold text-slate-800">{aiResult.purpose || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Priority</p>
                <p className="font-semibold text-emerald-700">{aiResult.priority}</p>
              </div>
            </div>

            {/* Missing Info Warning if any */}
            {aiResult.missing_information?.length > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Notice: System detected missing optional fields: {aiResult.missing_information.join(', ')}. You can complete them during staff review.</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSubmitWorkflow}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {submitting ? 'Creating Workflow Request...' : 'Confirm & Create Request'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
