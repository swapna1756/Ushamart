import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, CheckCircle, Loader2, Bell } from 'lucide-react';
import { notificationsApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

function NotifModal({ isOpen, onClose, onSave }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({ title:'', content:'', type:'promotional', status:'published' });
  const [saving, setSaving] = useState(false);
  useEffect(()=>{ if(isOpen) setForm({ title:'', content:'', type:'promotional', status:'published' }); },[isOpen]);
  if (!isOpen) return null;
  const handleSave = async () => {
    if (!form.title.trim()) { addToast('Title required','error'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch(e){ addToast(e.message,'error'); } finally{ setSaving(false); }
  };
  const fi='w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';
  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" style={{background:'rgba(15,23,42,0.6)',backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md animate-pop shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-sm font-black text-gray-900">New Notification</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Title *</label>
            <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Notification title" className={fi}/></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Message</label>
            <textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} rows={3} placeholder="Notification message…" className={fi+' resize-none'}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Type</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className={fi+' cursor-pointer'}>
                <option value="promotional">Promotional</option>
                <option value="order_update">Order Update</option>
                <option value="system">System</option>
              </select></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className={fi+' cursor-pointer'}>
                <option value="published">✅ Published</option>
                <option value="inactive">🚫 Draft</option>
              </select></div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving?<Loader2 size={13} className="spin"/>:<CheckCircle size={13}/>}{saving?'Sending…':'Send Notification'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { addToast } = useToast();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen,setModalOpen]=useState(false);
  const [confirmDel,setConfirmDel]=useState(null);

  const load=()=>notificationsApi.getAll().then(r=>setNotifs(r.data||[])).catch(e=>addToast(e.message,'error')).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const handleCreate=async(form)=>{ const r=await notificationsApi.create(form); setNotifs(prev=>[r.data,...prev]); addToast('Notification sent','success'); };
  const handleDelete=async()=>{
    try{ await notificationsApi.delete(confirmDel); setNotifs(prev=>prev.filter(n=>n.id!==confirmDel)); addToast('Deleted','success'); }
    catch(e){addToast(e.message,'error');} finally{setConfirmDel(null);}
  };

  const fmtTime=ts=>{ if(!ts) return '—'; const d=new Date(ts); return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); };

  if(loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <div><h1 className="text-lg font-black text-gray-900">Notifications</h1>
          <p className="text-xs text-gray-400 mt-0.5">{notifs.length} notifications sent</p></div>
        <button onClick={()=>setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition">
          <Plus size={14}/> Send Notification</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {notifs.length===0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell size={40} className="text-gray-200 mb-3"/>
            <p className="text-sm font-bold text-gray-600">No notifications yet</p>
            <button onClick={()=>setModalOpen(true)} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"><Plus size={12}/>Send First</button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map(n=>(
              <div key={n.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Bell size={16} className="text-primary"/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-gray-900">{n.title}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${n.status==='published'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{n.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{n.content||n.message||'—'}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">{fmtTime(n.sentTime||n.createdAt)}</p>
                </div>
                <button onClick={()=>setConfirmDel(n.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-300 flex items-center justify-center flex-shrink-0 transition"><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <NotifModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} onSave={handleCreate}/>
      <ConfirmDialog isOpen={!!confirmDel} title="Delete Notification" message="This notification will be removed." onConfirm={handleDelete} onCancel={()=>setConfirmDel(null)} confirmLabel="Delete"/>
    </div>
  );
}
