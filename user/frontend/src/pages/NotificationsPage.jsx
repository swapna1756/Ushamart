import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '../services/api';

function fmtTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_STYLES = {
  promotional: { bg: '#f5f3ff', border: '#ddd6fe', dot: '#7c3aed' },
  order_update:{ bg: '#ecfdf5', border: '#a7f3d0', dot: '#059669' },
  system:      { bg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb' },
};

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.getAll()
      .then(r => setNotifs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Bell size={18} className="text-primary" /> Notifications
        </h1>
        {notifs.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{notifs.length} announcements</p>}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-20 space-y-3">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell size={48} className="text-gray-200 mb-4" />
            <p className="text-sm font-bold text-gray-600">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">Store announcements will appear here</p>
          </div>
        ) : notifs.map(n => {
          const style = TYPE_STYLES[n.type] || TYPE_STYLES.promotional;
          return (
            <div key={n.id} className="rounded-2xl p-4 shadow-sm"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: style.dot + '22' }}>
                  <Bell size={16} style={{ color: style.dot }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-black text-gray-900 leading-tight">{n.title}</p>
                    <span className="text-[9px] text-gray-400 font-medium flex-shrink-0">{fmtTime(n.sentTime || n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{n.content || n.message}</p>
                  <span className="inline-block mt-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: style.dot + '22', color: style.dot }}>
                    {n.type?.replace('_', ' ') || 'promotional'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
