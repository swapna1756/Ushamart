import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, CheckCircle, Loader2 } from 'lucide-react';
import { couponsApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatINR } from '../utils/currency';

function CouponModal({ isOpen, onClose, onSave, editing }) {
 const { addToast } = useToast();
 const EMPTY = { code:'', type:'percentage', value:'', minSpend:'', description:'', status:'published' };
 const [form, setForm] = useState(EMPTY);
 const [saving, setSaving] = useState(false);
 useEffect(()=>{ if(isOpen) setForm(editing?{...EMPTY,...editing}:EMPTY); },[editing,isOpen]);
 if (!isOpen) return null;
 const set = (k,v) => setForm(p=>({...p,[k]:v}));
 const handleSave = async () => {
 if (!form.code.trim()) { addToast('Coupon code required','error'); return; }
 if (!form.value) { addToast('Value required','error'); return; }
 setSaving(true);
 try { await onSave(form, editing?.id); onClose(); }
 catch(e){ addToast(e.message,'error'); } finally{ setSaving(false); }
 };
 const fi='w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';
 return (
 <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" style={{background:'rgba(15,23,42,0.6)',backdropFilter:'blur(6px)'}} onClick={onClose}>
 <div className="bg-white rounded-3xl w-full max-w-md animate-pop shadow-2xl" onClick={e=>e.stopPropagation()}>
 <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
 <h2 className="text-sm font-semibold text-gray-900">{editing?'Edit Coupon':'New Coupon'}</h2>
 <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X size={14}/></button>
 </div>
 <div className="p-6 space-y-4">
 <div><label className="text-xs font-medium text-label block mb-1.5">Coupon Code *</label>
 <input value={form.code} onChange={e=>set('code',e.target.value.toUpperCase())} placeholder="WELCOME20" className={fi}/></div>
 <div className="grid grid-cols-2 gap-3">
 <div><label className="text-xs font-medium text-label block mb-1.5">Type</label>
 <select value={form.type} onChange={e=>set('type',e.target.value)} className={fi+' cursor-pointer'}>
 <option value="percentage">% Percentage</option>
 <option value="flat">? Flat Amount</option>
 <option value="free_delivery">?? Free Delivery</option>
 </select></div>
 <div><label className="text-xs font-medium text-label block mb-1.5">Value</label>
 <input type="number" min="0" value={form.value} onChange={e=>set('value',e.target.value)} placeholder={form.type==='percentage'?'20':'100'} className={fi}/></div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div><label className="text-xs font-medium text-label block mb-1.5">Min Spend (₹)</label>
 <input type="number" min="0" value={form.minSpend} onChange={e=>set('minSpend',e.target.value)} placeholder="500" className={fi}/></div>
 <div><label className="text-xs font-medium text-label block mb-1.5">Status</label>
 <select value={form.status} onChange={e=>set('status',e.target.value)} className={fi+' cursor-pointer'}>
 <option value="published">? Active</option><option value="inactive">?? Inactive</option>
 </select></div>
 </div>
 <div><label className="text-xs font-medium text-label block mb-1.5">Description</label>
 <input value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Coupon description" className={fi}/></div>
 </div>
 <div className="flex gap-3 px-6 pb-6">
 <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
 <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
 {saving?<Loader2 size={13} className="spin"/>:<CheckCircle size={13}/>}{saving?'Saving...':editing?'Update':'Create'}
 </button>
 </div>
 </div>
 </div>
 );
}

export default function CouponsPage() {
 const { addToast } = useToast();
 const [coupons, setCoupons] = useState([]);
 const [loading, setLoading] = useState(true);
 const [modalOpen,setModalOpen]=useState(false);
 const [editing, setEditing] = useState(null);
 const [confirmDel,setConfirmDel]=useState(null);

 const load=()=>couponsApi.getAll().then(r=>setCoupons(r.data||[])).catch(e=>addToast(e.message,'error')).finally(()=>setLoading(false));
 useEffect(()=>{load();},[]);

 const handleSave=async(form,id)=>{
 if(id){ const r=await couponsApi.update(id,form); setCoupons(prev=>prev.map(c=>c.id===id?r.data:c)); addToast('Coupon updated','success'); }
 else { const r=await couponsApi.create(form); setCoupons(prev=>[r.data,...prev]); addToast('Coupon created','success'); }
 };
 const handleDelete=async()=>{
 try{ await couponsApi.delete(confirmDel); setCoupons(prev=>prev.filter(c=>c.id!==confirmDel)); addToast('Coupon deleted','success'); }
 catch(e){addToast(e.message,'error');} finally{setConfirmDel(null);}
 };

 if(loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

 return (
 <div className="flex flex-col h-full">
 <div className="flex items-center justify-between px-4 sm:px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
 <div><h1 className="text-page-title text-gray-900">Discounts & Coupons</h1>
 <p className="text-xs text-muted mt-0.5">{coupons.length} coupons ... {coupons.filter(c=>c.status==='published').length} active</p></div>
 <button onClick={()=>{setEditing(null);setModalOpen(true);}} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-primary hover:bg-primary-hover shadow-md transition">
 <Plus size={14}/> Add Coupon</button>
 </div>
 <div className="flex-1 overflow-y-auto p-4 sm:p-6">
 {coupons.length===0 ? (
 <div className="flex flex-col items-center justify-center py-20 text-center">
 <p className="text-sm font-medium text-gray-600">No coupons yet</p>
 <button onClick={()=>{setEditing(null);setModalOpen(true);}} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-medium rounded-xl"><Plus size={12}/>Create Coupon</button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {coupons.map(c=>(
 <div key={c.id} className={`bg-white rounded-2xl border p-5 shadow-sm ${c.status==='published'?'border-green-100':'border-gray-100 opacity-70'}`}>
 <div className="flex items-start justify-between mb-3">
 <div>
 <span className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200 font-mono">{c.code}</span>
 <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${c.status==='published'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{c.status}</span>
 </div>
 <div className="flex gap-1">
 <button onClick={()=>{setEditing(c);setModalOpen(true);}} className="w-7 h-7 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center justify-center"><Edit2 size={12}/></button>
 <button onClick={()=>setConfirmDel(c.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"><Trash2 size={12}/></button>
 </div>
 </div>
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-xs">
 <span className="text-label">Discount</span>
 <span className="font-medium text-primary">{c.type==='percentage'?`${c.value}% off`:c.type==='flat'?`${formatINR(c.value)} off`:'Free Delivery'}</span>
 </div>
 <div className="flex items-center justify-between text-xs">
 <span className="text-label">Min Spend</span>
 <span className="font-semibold text-gray-700">{formatINR(c.minSpend||0)}</span>
 </div>
 {c.description&&<p className="text-xs text-muted mt-2 leading-relaxed">{c.description}</p>}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 <CouponModal isOpen={modalOpen} onClose={()=>{setModalOpen(false);setEditing(null);}} onSave={handleSave} editing={editing}/>
 <ConfirmDialog isOpen={!!confirmDel} title="Delete Coupon" message="This coupon will be permanently deleted." onConfirm={handleDelete} onCancel={()=>setConfirmDel(null)} confirmLabel="Delete"/>
 </div>
 );
}
