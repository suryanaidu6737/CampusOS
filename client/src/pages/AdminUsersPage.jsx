import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Users,
  Search,
  CheckCircle2,
  Upload,
  Clock,
  Mail,
  Send,
  AlertCircle,
  X,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { AdminImportUsersModal } from '../components/AdminImportUsersModal';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'STUDENT' | 'FACULTY' | 'PENDING'
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Email modal confirmation state
  const [selectedUserForEmail, setSelectedUserForEmail] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch admin users directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSendEmail = async () => {
    if (!selectedUserForEmail) return;

    setSendingEmail(true);
    setEmailSuccessMsg('');
    setEmailErrorMsg('');

    try {
      const res = await API.post(`/auth/users/${selectedUserForEmail._id}/send-activation-email`);
      if (res.data.success) {
        setEmailSuccessMsg(`✓ Activation email sent to ${selectedUserForEmail.email}. Expires in 24 hours.`);
        setTimeout(() => {
          setSelectedUserForEmail(null);
          setEmailSuccessMsg('');
          fetchUsers();
        }, 1800);
      } else {
        setEmailErrorMsg(res.data.message || 'Failed to send activation email.');
      }
    } catch (err) {
      console.error('Send activation email error:', err);
      setEmailErrorMsg(err.response?.data?.message || 'Activation email could not be sent. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const nextStatus = user.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      const res = await API.patch(`/auth/users/${user._id}/status`, { accountStatus: nextStatus });
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (activeTab === 'STUDENT') matchesTab = u.role === 'STUDENT';
    else if (activeTab === 'FACULTY') matchesTab = u.role === 'FACULTY';
    else if (activeTab === 'STAFF') matchesTab = u.role === 'STAFF';
    else if (activeTab === 'HOD') matchesTab = u.role === 'HOD';
    else if (activeTab === 'PENDING') matchesTab = u.accountStatus === 'PENDING_ACTIVATION';

    return matchesSearch && matchesTab;
  });

  const pendingCount = users.filter((u) => u.accountStatus === 'PENDING_ACTIVATION').length;
  const studentCount = users.filter((u) => u.role === 'STUDENT').length;
  const facultyCount = users.filter((u) => u.role === 'FACULTY').length;
  const staffCount = users.filter((u) => u.role === 'STAFF').length;
  const hodCount = users.filter((u) => u.role === 'HOD').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Users</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 transition flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import Users (CSV)</span>
          </button>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, or ID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('STUDENT')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'STUDENT'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Students ({studentCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('FACULTY')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'FACULTY'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Faculty ({facultyCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('STAFF')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'STAFF'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Staff ({staffCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('HOD')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'HOD'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>HODs ({hodCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'PENDING'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Activations ({pendingCount})</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading registered user accounts...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">User Details</th>
                  <th className="py-3 px-3">Institutional ID</th>
                  <th className="py-3 px-3">Role & Dept</th>
                  <th className="py-3 px-3">Account Status</th>
                  <th className="py-3 px-3">Activation Email Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => {
                  const isPending = u.accountStatus === 'PENDING_ACTIVATION';
                  const isSuspended = u.accountStatus === 'SUSPENDED';
                  const instId = u.studentId || u.employeeId || 'N/A';
                  const emailStatus = u.activationEmailStatus || 'NOT_SENT';

                  return (
                    <tr key={u._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {instId}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                              u.role === 'ADMIN'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : u.role === 'HOD'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : u.role === 'FACULTY' || u.role === 'STAFF'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {u.departmentId?.name || u.departmentId?.code || 'Central Admin'}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Activation</span>
                          </span>
                        ) : isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Suspended</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {isPending ? (
                          <div className="space-y-0.5">
                            {emailStatus === 'SENT' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Mail className="w-3 h-3 text-emerald-600" />
                                <span>Sent</span>
                              </span>
                            )}
                            {emailStatus === 'FAILED' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>Delivery Failed</span>
                              </span>
                            )}
                            {emailStatus === 'NOT_SENT' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>Not Sent</span>
                              </span>
                            )}

                            {u.activationEmailSentAt && (
                              <p className="text-[9px] text-slate-400 flex items-center gap-1 pt-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(u.activationEmailSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <button
                              onClick={() => {
                                setSelectedUserForEmail(u);
                                setEmailSuccessMsg('');
                                setEmailErrorMsg('');
                              }}
                              className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition inline-flex items-center gap-1.5"
                            >
                              <Send className="w-3 h-3" />
                              <span>{emailStatus === 'SENT' ? 'Resend Email' : 'Send Email'}</span>
                            </button>
                          )}

                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition inline-flex items-center gap-1 border ${
                                isSuspended
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                              }`}
                            >
                              {isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Send Activation Email Confirmation Modal */}
      {selectedUserForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5 relative">
            <button
              onClick={() => setSelectedUserForEmail(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 border border-brand-100">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Send Activation Email</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Trigger secure Resend activation email delivery
                </p>
              </div>
            </div>

            {emailSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{emailSuccessMsg}</span>
              </div>
            )}

            {emailErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{emailErrorMsg}</span>
              </div>
            )}

            {!emailSuccessMsg && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <p className="text-slate-700">
                  Send an activation email to:
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-medium">
                  <p className="font-bold text-slate-900">{selectedUserForEmail.name}</p>
                  <p className="text-brand-700 font-mono text-[11px]">{selectedUserForEmail.email}</p>
                  <p className="text-slate-500 text-[10px] mt-1">
                    Institutional ID: {selectedUserForEmail.studentId || selectedUserForEmail.employeeId || 'N/A'}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  A secure, one-time activation code will be generated and delivered to this email address. The code expires in 24 hours.
                </p>
              </div>
            )}

            {!emailSuccessMsg && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedUserForEmail(null)}
                  disabled={sendingEmail}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition flex items-center gap-2 text-xs"
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Email</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <AdminImportUsersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchUsers}
      />
    </div>
  );
};
