import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Notifications & Alerts</h1>
            <p className="text-xs text-slate-500">Real-time workflow progression updates</p>
          </div>
        </div>
        <button onClick={fetchNotifications} className="text-xs text-brand-600 font-bold hover:underline">
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-3">
        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No notifications found.
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                n.read ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white border-brand-200 shadow-sm text-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {n.type === 'SUCCESS' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : n.type === 'WARNING' || n.type === 'ACTION_REQUIRED' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                )}

                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold">{n.title}</h4>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  <p className="text-[10px] text-slate-400 font-mono pt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {n.requestId && (
                  <Link
                    to={`/requests/${n.requestId}`}
                    className="text-[11px] font-bold text-brand-600 hover:underline px-2.5 py-1 rounded bg-brand-50"
                  >
                    View Request
                  </Link>
                )}
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
