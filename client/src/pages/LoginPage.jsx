import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowRight, Lock, Mail, KeyRound, Key, CheckCircle2, AlertCircle, X, Send, RefreshCw, Clock } from 'lucide-react';
import API from '../services/api';

export const LoginPage = () => {
  const [email, setEmail] = useState('surya@campus.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Activation modal state (2-stage flow)
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [actIdentifier, setActIdentifier] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [registeredEmailDisplay, setRegisteredEmailDisplay] = useState('');
  const [actCode, setActCode] = useState('');
  const [actPassword, setActPassword] = useState('');
  const [actConfirmPassword, setActConfirmPassword] = useState('');
  
  const [actError, setActError] = useState('');
  const [actSuccess, setActSuccess] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [actLoading, setActLoading] = useState(false);

  // Resend cooldown timer (60s)
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleRoleRedirect = (role) => {
    switch (role) {
      case 'STUDENT':
        navigate('/student/dashboard', { replace: true });
        break;
      case 'STAFF':
      case 'FACULTY':
        navigate('/staff/dashboard', { replace: true });
        break;
      case 'HOD':
        navigate('/hod/dashboard', { replace: true });
        break;
      case 'ADMIN':
        navigate('/admin/dashboard', { replace: true });
        break;
      default:
        navigate('/student/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role) {
        handleRoleRedirect(loggedUser.role);
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.requiresActivation) {
        setError(err.response.data.message);
        setActIdentifier(email);
        setShowActivationModal(true);
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Stage 1: Send Activation Code to User's Email
  const handleSendActivationCode = async (e) => {
    if (e) e.preventDefault();
    setSendingCode(true);
    setActError('');
    setActSuccess('');

    try {
      const res = await API.post('/auth/activation/send-code', {
        identifier: actIdentifier,
      });

      if (res.data.success) {
        setCodeSent(true);
        setRegisteredEmailDisplay(res.data.registeredEmail || 'your registered email');
        setActSuccess(res.data.message || 'Activation code sent to your registered email.');
        setCooldownSeconds(60); // 60-second cooldown
      } else {
        setActError(res.data.message || 'Failed to send activation code.');
      }
    } catch (err) {
      setActError(err.response?.data?.message || 'Activation code could not be sent. Please check identifier.');
    } finally {
      setSendingCode(false);
    }
  };

  // Stage 2: Verify Code and Set Password
  const handleCompleteActivation = async (e) => {
    e.preventDefault();
    setActLoading(true);
    setActError('');
    setActSuccess('');

    if (actPassword !== actConfirmPassword) {
      setActError('Passwords do not match. Please verify.');
      setActLoading(false);
      return;
    }

    try {
      const res = await API.post('/auth/activation/complete', {
        identifier: actIdentifier,
        activationCode: actCode,
        newPassword: actPassword,
      });

      if (res.data.success) {
        setActSuccess(res.data.message || 'Account activated successfully! Redirecting...');
        setTimeout(() => {
          setShowActivationModal(false);
          if (res.data.user?.email) {
            setEmail(res.data.user.email);
          }
        }, 1500);
      }
    } catch (err) {
      setActError(err.response?.data?.message || 'Failed to activate account. Verify activation code.');
    } finally {
      setActLoading(false);
    }
  };

  const resetModalState = () => {
    setShowActivationModal(false);
    setCodeSent(false);
    setActCode('');
    setActPassword('');
    setActConfirmPassword('');
    setActError('');
    setActSuccess('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-200 space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">CampusOS AI</h1>
          <p className="text-xs text-brand-700 font-bold uppercase tracking-wider">Swarnandhra University Platform</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Institutional Email / ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@campus.edu"
                required
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to CampusOS'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={() => {
              setActIdentifier(email);
              setShowActivationModal(true);
            }}
            className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" />
            <span>Activate Account</span>
          </button>

          <p className="text-[11px] text-slate-400 font-medium">
            Protected University Portal • Role determined by server session
          </p>
        </div>
      </div>

      {/* Interactive 2-Stage Account Activation Modal */}
      {showActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5 relative">
            <button
              onClick={resetModalState}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-600" /> Activate Account
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {!codeSent
                  ? 'Enter your Institutional ID (Student/Faculty ID) or Email to receive an activation code.'
                  : `Enter the activation code delivered to ${registeredEmailDisplay} and create your password.`}
              </p>
            </div>

            {actError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actError}</span>
              </div>
            )}

            {actSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{actSuccess}</span>
              </div>
            )}

            {/* Stage 1: Request Activation Code */}
            {!codeSent ? (
              <form onSubmit={handleSendActivationCode} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Institutional ID or Email</label>
                  <input
                    type="text"
                    value={actIdentifier}
                    onChange={(e) => setActIdentifier(e.target.value)}
                    placeholder="e.g. STU-2026-001 or email@campus.edu"
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingCode}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2"
                >
                  {sendingCode ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Activation Code...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Activation Code</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Stage 2: Code Verification & Password Creation */
              <form onSubmit={handleCompleteActivation} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Activation Code</label>
                  <input
                    type="text"
                    value={actCode}
                    onChange={(e) => setActCode(e.target.value)}
                    placeholder="e.g. C8K4-29P7"
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono uppercase tracking-widest focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Create Password</label>
                  <input
                    type="password"
                    value={actPassword}
                    onChange={(e) => setActPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={actConfirmPassword}
                    onChange={(e) => setActConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actLoading}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2"
                >
                  {actLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Set Password & Activate</span>
                    </>
                  )}
                </button>

                {/* Resend Code Button with 60s Cooldown */}
                <div className="pt-2 text-center">
                  {cooldownSeconds > 0 ? (
                    <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Resend Code in {cooldownSeconds}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendActivationCode}
                      disabled={sendingCode}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-800 hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend Activation Code</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
