import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, CheckCircle, Loader2, Bell, Users, User } from 'lucide-react';
import { notificationsApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUploader from '../components/ImageUploader';

const PRIORITIES = ['low','normal','high','urgent'];
const CATEGORIES = ['general','promotional','order_update','system','offer','reminder'];
const TYPES      = ['promotional','order_update','system','announcement'];

const PRIORITY_BADGE = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  normal: 'bg-green-100 text-green-700',
  low:    'bg-gray-100 text-gray-500',
};

function NotifModal({ isOpen, onClose, onSave, editing }) {
  const { addToast } = useToast();
  const EMPTY = {
    title:'', content:'', type:'promotional', category:'general',
    priority:'normal', targetAudience:'all', targetUserIds:[],
    imageUrl:'', status:'published', scheduledAt:'', expiresAt:'',
  };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm(editing ? { ...EMPTY, ...editing } : EMPTY);
  }, [editing, isOpen]);

  if (!isOpen) return null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { addToast('Title is required', 'error'); return; }
    setSaving(true);
    try { await onSave(form, editing?.id); onClose(); }
    catch (e) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const fi = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,0.6)', backdropFilter:'blur(6px)' }} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col animate-pop shadow-2xl"
        style={{ maxHeight:'92vh' }} onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-black text-gray-900">{editing ? 'Edit Notification' : 'Send Notification'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Stored permanently in database</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X size={14}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Notification title" className={fi}/>
          </div>

          {/* Content */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Message</label>
            <textarea value={form.content} onChange={e=>set('content',e.target.value)} rows={3}
              placeholder="Notification message…" className={fi+' resize-none'}/>
          </div>

          {/* Image */}
          <ImageUploader
            label="Notification Image (optional)"
            value={form.imageUrl}
            onChange={url => set('imageUrl', url)}
            hint="JPG, PNG, WebP · Max 5 MB"
          />

          {/* Type + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Type</label>
              <select value={form.type} onChange={e=>set('type',e.target.value)} className={fi+' cursor-pointer'}>
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Category</label>
              <select value={form.category} onChange={e=>set('category',e.target.value)} className={fi+' cursor-pointer'}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Priority</label>
              <select value={form.priority} onChange={e=>set('priority',e.target.value)} className={fi+' cursor-pointer'}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={form.status} onChange={e=>set('status',e.target.value)} className={fi+' cursor-pointer'}>
                <option value="published">✅ Published</option>
                <option value="draft">📝 Draft</option>
                <option value="inactive">🚫 Inactive</option>
              </select>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Target Audience</label>
            <div className="flex gap-2">
              {[['all','All Users'],['specific','Specific Users']].map(([v,l])=>(
                <button key={v} type="button" onClick={()=>set('targetAudience',v)}
                  className="flex items-center gap-2 flex-1 p-3 rounded-xl border-2 text-xs font-bold transition"
                  style={{ borderColor:form.targetAudience===v?'#0B6F3A':'#e5e7eb', background:form.targetAudience===v?'#E7F5ED':'#fff', color:form.targetAudience===v?'#0B6F3A':'#6b7280' }}>
                  {v==='all'?<Users size={14}/>:<User size={14}/>} {l}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule + Expires */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Schedule At (optional)</label>
              <input type="datetime-local" value={form.scheduledAt||''} onChange={e=>set('scheduledAt',e.target.value)} className={fi}/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Expires At (optional)</label>
              <input type="datetime-local" value={form.expiresAt||''} onChange={e=>set('expiresAt',e.target.value)} className={fi}/>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving?<Loader2 size={13} className="spin"/>:<CheckCircle size={13}/>}
            {saving?'Sending…':editing?'Update':'Send Notification'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { addToast } = useToast();
  const [notifs,     setNotifs]    = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [modalOpen,  setModalOpen] = useState(false);
  const [editing,    setEditing]   = useState(null);
  const [confirmDel, setConfirmDel]= useState(null);

  const load = () => notificationsApi.getAll()
    .then(r => setNotifs(r.data||[]))
    .catch(e => addToast(e.message,'error'))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSave = async (form, id) => {
    if (id) {
      const r = await notificationsApi.update(id, form);
      setNotifs(prev => prev.map(n => n.id===id ? r.data : n));
      addToast('Notification updated', 'success');
    } else {
      const r = await notificationsApi.create(form);
      setNotifs(prev => [r.data, ...prev]);
      addToast('Notification sent', 'success');
    }
  };

  const handleDelete = async () => {
    try {
      await notificationsApi.delete(confirmDel);
      setNotifs(prev => prev.filter(n => n.id !== confirmDel));
      addToast('Notification deleted', 'success');
    } catch (e) { addToast(e.message, 'error'); }
    finally { setConfirmDel(null); }
  };

  const fmtDate = ts => ts ? new Date(ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <div>
          <h1 className="text-lg font-black text-gray-900 flex items-center gap-2"><Bell size={18} className="text-primary"/>Notifications</h1>
          <p className="text-xs text-gray-400 mt-0.5">{notifs.length} total · {notifs.filter(n=>n.status==='published').length} published</p>
        </div>
        <button onClick={()=>{setEditing(null);setModalOpen(true);}}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition">
          <Plus size={14}/> Send Notification
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell size={40} className="text-gray-200 mb-3"/>
            <p className="text-sm font-bold text-gray-600">No notifications yet</p>
            <button onClick={()=>{setEditing(null);setModalOpen(true);}} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl">
              <Plus size={12}/> Send First Notification
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map(n => (
              <div key={n.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-start gap-4">
                {/* Image or icon */}
                <div className="flex-shrink-0">
                  {n.imageUrl ? (
                    <img src={n.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                      onError={e=>e.target.style.display='none'}/>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bell size={18} className="text-primary"/>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-gray-900">{n.title}</p>
                      {(n.content||n.message) && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content||n.message}</p>
                      )}
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${n.status==='published'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {n.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {n.priority && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full capitalize ${PRIORITY_BADGE[n.priority]||PRIORITY_BADGE.normal}`}>{n.priority}</span>}
                    {n.category && <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{n.category}</span>}
                    {n.targetAudience && <span className="text-[9px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize flex items-center gap-1"><Users size={9}/>{n.targetAudience==='all'?'All Users':'Specific'}</span>}
                    <span className="text-[9px] text-gray-400 ml-auto">{fmtDate(n.sentTime||n.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={()=>{setEditing(n);setModalOpen(true);}} className="w-7 h-7 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center justify-center transition"><Edit2 size={12}/></button>
                  <button onClick={()=>setConfirmDel(n.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NotifModal isOpen={modalOpen} onClose={()=>{setModalOpen(false);setEditing(null);}} onSave={handleSave} editing={editing}/>
      <ConfirmDialog isOpen={!!confirmDel} title="Delete Notification" message="This notification will be removed permanently." onConfirm={handleDelete} onCancel={()=>setConfirmDel(null)} confirmLabel="Delete"/>
    </div>
  );
}
