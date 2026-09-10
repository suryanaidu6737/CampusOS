import React from 'react';
import { AIAssistant } from '../components/student/AIAssistant';
import { useNavigate } from 'react-router-dom';

export const StudentAssistantPage = () => {
  const navigate = useNavigate();

  const handleRequestCreated = () => {
    navigate('/student/requests');
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Request Assistant</h1>
        <p className="text-xs text-slate-500">
          Describe your campus need in plain text. CampusOS AI will classify, validate, and route your request.
        </p>
      </div>

      <AIAssistant onRequestCreated={handleRequestCreated} />
    </div>
  );
};
