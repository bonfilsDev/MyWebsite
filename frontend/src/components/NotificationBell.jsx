import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get('/auth/notifications');
      setNotifications(data.notifications || []);
      setUnread(Number(data.unread) || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markRead = async () => {
    try {
      await api.patch('/auth/notifications/read');
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error(e);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markRead();
  };

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d.includes('T') ? d : d.replace(' ', 'T') + 'Z');
    if (isNaN(dt)) return d;
    return dt.toLocaleString();
  };

  const typeIcon = (type) =>
    type === 'email' ? '📧' : type === 'login' ? '🔑' : '🔔';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2.5 rounded-lg bg-white shadow hover:bg-gray-50 transition"
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 flex items-center justify-between">
            <span>Notifications</span>
            {unread > 0 && <span className="text-xs font-semibold text-red-500">{unread} unread</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-gray-50 flex gap-3 ${n.is_read ? 'opacity-60' : ''}`}>
                <span className="text-lg">{typeIcon(n.type)}</span>
                <div>
                  <div className="text-sm text-gray-800">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(n.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}