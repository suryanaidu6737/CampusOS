import React from 'react';
import { CheckCircle2, Clock, Circle, AlertCircle } from 'lucide-react';

export const Timeline = ({ steps = [], currentStepIndex = 0, status, history = [] }) => {
  return (
    <div className="py-4">
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        {/* Background connector line for desktop */}
        <div className="hidden md:block absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0" />

        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex || status === 'COMPLETED';
          const isCurrent = idx === currentStepIndex && status !== 'COMPLETED' && status !== 'REJECTED';
          const isRejected = status === 'REJECTED' && idx === currentStepIndex;

          const historyEntry = history.find((h) => h.step === step.stepKey);

          return (
            <div key={step.stepKey || idx} className="relative z-10 flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center flex-1">
              {/* Step Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition border-2 ${
                  isDone
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : isRejected
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : isCurrent
                    ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-600/30 animate-pulse'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isRejected ? (
                  <AlertCircle className="w-5 h-5" />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>

              {/* Step Info */}
              <div>
                <p className={`text-xs font-bold ${isCurrent ? 'text-brand-700' : isDone ? 'text-emerald-800' : 'text-slate-600'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {step.roleRequired}
                </p>

                {historyEntry && (
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5 space-y-0.5">
                    {historyEntry.performedBy?.name && (
                      <p className="font-semibold text-slate-700">
                        {historyEntry.performedBy.name}
                      </p>
                    )}
                    <p className="text-slate-400">
                      {new Date(historyEntry.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
