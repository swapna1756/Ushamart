import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/asset';

const READ_KEY = 'ushamart_read_notifs';

function getReadIds() {
 try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
 catch { return new Set(); }
}
function saveReadIds(set) {
 localStorage.setItem(READ_KEY, JSON.stringify([...set]));
}

function fmtTime(ts) {
 if (!ts) return '';
 const diff = Date.now() - ts;
 const m = Math.floor(diff / 60000);
 if (m < 1) return 'Just now';
 if (m < 60) return `${m}m ago`;
 const h = Math.floor(m / 60);
 if (h < 24) return `${h}h ago`;
 const d = Math.floor(h / 24);
 if (d < 7) return `${d}d ago`;
 return new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
}

const PRIORITY_STYLE = {
 urgent: { bg:'#fef2f2', border:'#fecaca', dot:'#ef4444', badge:'bg-red-100 text-red-700' },
 high: { bg:'#fff7ed', border:'#fed7aa', dot:'#f97316', badge:'bg-orange-100 text-orange-700' },
 normal: { bg:'#f0fdf4', border:'#bbf7d0', dot:'#22c55e', badge:'bg-green-100 text-green-700' },
 low: { bg:'#f8fafc', border:'#e2e8f0', dot:'#94a3b8', badge:'bg-gray-100 text-gray-500' },
};

export default function NotificationsPage() {
 const { user } = useAuth();
 const [notifs, setNotifs] = useState([]);
 const [loading, setLoading] = useState(true);
 const [readIds, setReadIds] = useState(getReadIds);

 const load = useCallback(() => {
 setLoading(true);
 notificationsApi.getAll()
 .then(r => setNotifs(r.data || []))
 .catch(console.error)
 .finally(() => setLoading(false));
 }, []);

 useEffect(() => { load(); }, [load]);

 const markRead = async (id) => {
 if (readIds.has(id)) return;
 const next = new Set(readIds); next.add(id);
 setReadIds(next); saveReadIds(next);
 if (user) {
 try { await notificationsApi.markRead(id); } catch { /* ignore */ }
 }
 };

 const markAllRead = () => {
 const next = new Set([...readIds, ...notifs.map(n => n.id)]);
 setReadIds(next); saveReadIds(next);
 };

 const unreadCount = notifs.filter(n => !readIds.has(n.id)).length;

 if (loading) return (
 <div className="flex items-center justify-center min-h-screen">
 <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
 </div>
 );

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Header */}
 <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
 <div>
 <h1 className="text-page-title text-gray-900 flex items-center gap-2">
 <div className="relative">
 <Bell size={18} className="text-primary" />
 {unreadCount > 0 && (
 <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-secondary rounded-full text-white text-[10px] font-medium flex items-center justify-center">
 {unreadCount > 9 ? '9+' : unreadCount}
 </span>
 )}
 </div>
 Notifications
 </h1>
 <p className="text-xs text-muted mt-0.5">
 {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
 </p>
 </div>
 {unreadCount > 0 && (
 <button onClick={markAllRead}
 className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 transition">
 <CheckCheck size={12} /> Mark all read
 </button>
 )}
 </div>

 <div className="max-w-2xl mx-auto px-4 py-4 pb-20 space-y-3">
 {notifs.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 text-center">
 <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
 <Bell size={36} className="text-gray-300" />
 </div>
 <h2 className="text-base font-semibold text-gray-700">No notifications yet</h2>
 <p className="text-sm text-gray-400 mt-1">Store announcements will appear here</p>
 </div>
 ) : notifs.map(n => {
 const isRead = readIds.has(n.id);
 const pStyle = PRIORITY_STYLE[n.priority] || PRIORITY_STYLE.normal;

 return (
 <div key={n.id}
 onClick={() => markRead(n.id)}
 className="rounded-2xl shadow-sm overflow-hidden cursor-pointer transition hover:shadow-md"
 style={{ background: isRead ? '#fff' : pStyle.bg, border: `1px solid ${isRead ? '#f0f0f0' : pStyle.border}` }}>
 <div className="flex gap-3 p-4">
 {/* Image or icon */}
 <div className="flex-shrink-0">
 {n.imageUrl ? (
 <img src={resolveImageUrl(n.imageUrl)} alt={n.title}
 className="w-12 h-12 rounded-xl object-cover border border-gray-100"
 onError={e => e.target.style.display = 'none'} />
 ) : (
 <div className="w-12 h-12 rounded-xl flex items-center justify-center"
 style={{ background: pStyle.bg, border: `1px solid ${pStyle.border}` }}>
 <Bell size={20} style={{ color: pStyle.dot }} />
 </div>
 )}
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-center gap-2 flex-wrap">
 <p className={`text-sm leading-snug ${isRead ? 'font-semibold text-gray-700' : 'font-semibold text-gray-900'}`}>
 {n.title}
 </p>
 {!isRead && (
 <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pStyle.dot }} />
 )}
 </div>
 <span className="text-xs text-muted font-medium flex-shrink-0">
 {fmtTime(n.sentTime || n.createdAt)}
 </span>
 </div>

 {(n.content || n.message) && (
 <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-3">
 {n.content || n.message}
 </p>
 )}

 <div className="flex items-center gap-2 mt-2 flex-wrap">
 {n.priority && n.priority !== 'normal' && (
 <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${pStyle.badge}`}>
 {n.priority}
 </span>
 )}
 {n.category && (
 <span className="text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full capitalize">
 {n.category}
 </span>
 )}
 {n.type && (
 <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
 {n.type}
 </span>
 )}
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}
