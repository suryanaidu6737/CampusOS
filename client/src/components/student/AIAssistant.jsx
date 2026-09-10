import React, { useState, useRef, useEffect } from 'react';
import API from '../../services/api';
import { Bot, Send, Sparkles, CheckCircle2, ArrowRight, Clock, User, Check, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIAssistant = ({ onRequestCreated }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "How can I help with your campus request today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({
    workflowKey: null,
    stage: 'INTAKE',
    extractedData: {},
    title: null,
  });
  const [activeReasoning, setActiveReasoning] = useState([]);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (overrideText) => {
    const textToSend = overrideText || input;
    if (!textToSend || !textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/ai/chat', {
        promptText: textToSend,
        context,
      });

      const data = res.data;

      if (data.success) {
        setContext({
          workflowKey: data.workflowKey || context.workflowKey,
          stage: data.stage || context.stage,
          extractedData: data.extractedData || context.extractedData,
          title: data.title || context.title,
        });

        if (data.reasoningTrace) {
          setActiveReasoning(data.reasoningTrace);
        }

        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.responseText,
          stage: data.stage,
          summary: data.summary,
          createdRequest: data.createdRequest,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);

        if (data.createdRequest) {
          if (onRequestCreated) onRequestCreated(data.createdRequest);
        }
      } else {
        setError(data.message || 'Failed to process AI response.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    handleSend('Yes, submit this request.');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black flex items-center gap-2">
              CampusOS Conversational AI Agent
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Context-Aware Agentic Pipeline
              </span>
            </h2>
            <p className="text-xs text-slate-400">Autonomous workflow selection, validation, context memory, and backend execution</p>
          </div>
        </div>
      </div>

      {/* Main Chat & Reasoning Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
        {/* Left: Chat Thread */}
        <div className="flex-1 flex flex-col justify-between p-4 md:p-6 space-y-4 overflow-y-auto max-h-[550px]">
          <div className="space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-lg rounded-2xl p-4 space-y-2 shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white font-medium rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                  {/* Render Confirmation Card if in AWAITING_CONFIRMATION stage */}
                  {m.stage === 'AWAITING_CONFIRMATION' && m.summary && (
                    <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-brand-200 space-y-2 text-slate-900 font-normal">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 font-bold">
                        <span className="text-[11px] uppercase tracking-wider text-brand-700">Official Request Preview</span>
                        <span className="text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded font-mono">Ready to Submit</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <p><strong>Workflow:</strong> {m.summary.type}</p>
                        <p><strong>Purpose:</strong> {m.summary.purpose}</p>
                        {m.summary.dates && <p><strong>Dates:</strong> {m.summary.dates}</p>}
                        {m.summary.location && <p><strong>Location:</strong> {m.summary.location}</p>}
                        <p><strong>Department:</strong> {m.summary.department}</p>
                        <p><strong>Assigned Officer:</strong> {m.summary.assignedTo}</p>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={handleConfirmSubmit}
                          disabled={loading}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 text-xs"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirm & Submit Request</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render Link to Created Request */}
                  {m.createdRequest && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700">Request #{m.createdRequest.requestNumber} Active</span>
                      <button
                        onClick={() => navigate(`/requests/${m.createdRequest._id}`)}
                        className="px-3 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg font-bold text-[11px] border border-brand-200 transition flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Live Timeline</span>
                      </button>
                    </div>
                  )}

                  <span className={`text-[9px] block text-right font-mono ${m.sender === 'user' ? 'text-brand-200' : 'text-slate-400'}`}>
                    {m.time}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 text-slate-500 font-medium flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                  <span>CampusOS AI Agent is evaluating context & validating required fields...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Action Chips */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase self-center">Try Prompts:</span>
            {[
              "I lost my ID card",
              "I need a bonafide certificate",
              "I have a problem with my college fees",
              "There is an issue in my classroom",
              "I want permission for a college event",
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleSend(sample)}
                className="text-[11px] font-medium bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 px-3 py-1 rounded-xl transition border border-slate-200 shadow-2xs"
              >
                "{sample}"
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative pt-1"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your request or reply to AI follow-up..."
              className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs bg-white shadow-inner font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Panel: Live Agent Reasoning & State Trace */}
        <div className="w-full md:w-80 bg-white border-l border-slate-200 p-5 space-y-4 shrink-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Agent Execution Trace</h3>
          </div>

          <div className="space-y-3">
            {activeReasoning.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">Autonomous Reasoning</p>
                <p className="text-[11px] text-slate-400">Send a message to watch real-time intent parsing, field validation, and routing steps.</p>
              </div>
            ) : (
              activeReasoning.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                    step.status === 'completed'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : step.status === 'action_required'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-[11px]">
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      {step.title}
                    </span>
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white/80 border border-slate-200">
                      {step.stage}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug">{step.detail}</p>
                </div>
              ))
            )}
          </div>

          {/* Context Memory State Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-mono text-brand-300 font-bold uppercase tracking-wider">Context Memory</span>
              <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{context.stage}</span>
            </div>
            <div className="space-y-1 font-mono text-[10px] text-slate-300">
              <p><span className="text-slate-500">Workflow:</span> {context.workflowKey || 'Detecting...'}</p>
              <p><span className="text-slate-500">Purpose:</span> {context.extractedData.purpose || 'None'}</p>
              {context.extractedData.leave_dates && <p><span className="text-slate-500">Dates:</span> {context.extractedData.leave_dates}</p>}
              {context.extractedData.location && <p><span className="text-slate-500">Location:</span> {context.extractedData.location}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
