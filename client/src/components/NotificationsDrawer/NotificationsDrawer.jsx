import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, AlertCircle, CheckCircle2, ShieldAlert, Info } from 'lucide-react';
import api from '../../services/api.js';
import { subscribeToNotifications } from '../../services/socket.js';

export function NotificationsDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return () => unsubscribe();
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">System Notifications</h2>
                <p className="text-xs text-slate-400">Ingestion alerts & security audits</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-950/40 hover:bg-indigo-900/40 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="text-center py-8 text-sm text-slate-400">
                Loading notifications...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 stroke-[1.5] text-slate-600" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-slate-600">Document indexing events will show up here</p>
              </div>
            )}

            {!loading && notifications.map((notif) => {
              let Icon = Info;
              let iconColor = 'text-blue-400 bg-blue-950/50 border-blue-800/40';

              if (notif.type === 'ingestion_success') {
                Icon = CheckCircle2;
                iconColor = 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40';
              } else if (notif.type === 'ingestion_failure') {
                Icon = AlertCircle;
                iconColor = 'text-rose-400 bg-rose-950/50 border-rose-800/40';
              } else if (notif.type === 'guardrail_alert') {
                Icon = ShieldAlert;
                iconColor = 'text-amber-400 bg-amber-950/50 border-amber-800/40';
              }

              return (
                <div
                  key={notif._id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    notif.isRead 
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-400' 
                      : 'bg-slate-800/60 border-slate-700 text-slate-200 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${iconColor} flex-shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{notif.title}</h4>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNotif(notif._id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationsDrawer;
