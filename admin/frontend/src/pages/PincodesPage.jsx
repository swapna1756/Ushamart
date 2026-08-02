import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Loader2, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import { pincodesApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function PincodesPage() {
  const { addToast } = useToast();
  const [pins,    setPins]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [adding,  setAdding]  = useState(false);
  const [pinErr,  setPinErr]  = useState('');
  const [editing, setEditing] = useState(null); // { id, charge, time, enabled }
  const [saving,  setSaving]  = useState(false);
  const [confirmDel,setConfirmDel] = useState(null);

  const TIMES = ['Same Day','1-2 Days','2-3 Days','3-5 Days','5-7 Days'];

  const load = async () => {
    setLoading(true);
    try {
      const r = await pincodesApi.getAll();
      setPins(r.data || []);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async e => {
    e.preventDefault(); setPinErr('');
    const clean = newCode.trim();
    if (!/^\d{6}$/.test(clean)) { setPinErr('Enter a valid 6-digit pincode.'); return; }
    if (pins.find(p => (p.code || p.id) === clean)) { setPinErr('Pincode already exists.'); return; }
    setAdding(true);
    try {
      await pincodesApi.create({ code: clean, charges: 0, deliveryTime: '1-2 Days', enabled: true });
      setNewCode('');
      addToast(`Pincode ${clean} added`, 'success');
      await load(); // re-fetch from DB to confirm persistence
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const openEdit = p => setEditing({
    id:           p.code || p.id,
    charges:      p.charges ?? 0,
    deliveryTime: p.deliveryTime || '1-2 Days',
    enabled:      p.enabled !== false,
  });

  const saveEdit = async () => {
    setSaving(true);
    try {
      await pincodesApi.update(editing.id, {
        charges:      Number(editing.charges),
        deliveryTime: editing.deliveryTime,
        enabled:      editing.enabled,
      });
      addToast('Config saved', 'success');
      setEditing(null);
      await load(); // re-fetch from DB to confirm persistence
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const code = confirmDel;
    setConfirmDel(null);
    try {
      await pincodesApi.delete(code);
      addToast(`Pincode ${code} deleted`, 'success');
      await load(); // re-fetch from DB to confirm deletion
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <h1 className="text-lg font-black text-gray-900">Pincode Management</h1>
        <p className="text-xs text-gray-400 mt-0.5">{pins.length} serviceable pincodes</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Add pincode */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Plus size={14} className="text-primary"/>Add Serviceable Pincode</h3>
          <form onSubmit={handleAdd} className="flex gap-3 items-start">
            <div className="flex-1 max-w-xs">
              <input value={newCode} onChange={e=>{setNewCode(e.target.value.replace(/\D/g,'').slice(0,6));setPinErr('');}} placeholder="6-digit pincode" maxLength={6} className={inp+(pinErr?' border-red-300':'')}/>
              {pinErr&&<p className="text-xs text-red-500 mt-1">{pinErr}</p>}
            </div>
            <button type="submit" disabled={adding||newCode.length!==6} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-md">
              {adding?<Loader2 size={14} className="spin"/>:<Plus size={14}/>} Add
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Configured Pincodes</h3>
          </div>
          {pins.length===0 ? (
            <div className="text-center py-12"><MapPin size={28} className="mx-auto mb-2 text-gray-200"/><p className="text-xs text-gray-400 font-semibold">No pincodes yet</p></div>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Pincode','Area/City','Delivery Charge','Est. Time','Status','Actions'].map(h=>(
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {pins.map(p=>{
                  const code=p.code||p.id;
                  const isEditing=editing?.id===code;
                  return (
                    <tr key={code} className="hover:bg-gray-50/60 transition group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin size={13} className="text-primary"/></div>
                          <span className="font-black text-gray-800 tracking-wider">{code}</span></div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{p.areaName||'—'}{p.city&&`, ${p.city}`}</td>
                      {isEditing ? (
                        <>
                          <td className="px-5 py-3"><div className="relative w-28"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                            <input type="number" min="0" value={editing.charges} onChange={e=>setEditing(v=>({...v,charges:e.target.value}))} className="w-full border border-primary/40 rounded-xl pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"/></div></td>
                          <td className="px-5 py-3"><select value={editing.deliveryTime} onChange={e=>setEditing(v=>({...v,deliveryTime:e.target.value}))} className="border border-primary/40 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                            {TIMES.map(t=><option key={t}>{t}</option>)}</select></td>
                          <td className="px-5 py-3 text-center"><button onClick={()=>setEditing(v=>({...v,enabled:!v.enabled}))}>{editing.enabled?<ToggleRight size={24} className="text-primary"/>:<ToggleLeft size={24} className="text-gray-300"/>}</button></td>
                          <td className="px-5 py-3"><div className="flex gap-1.5">
                            <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-50">{saving?<Loader2 size={11} className="spin"/>:<Check size={11}/>}Save</button>
                            <button onClick={()=>setEditing(null)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-xs font-bold text-gray-500 rounded-lg hover:bg-gray-50"><X size={11}/>Cancel</button>
                          </div></td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3.5"><span className={`text-sm font-bold ${(p.charges||0)===0?'text-green-600':'text-gray-700'}`}>{(p.charges||0)===0?'Free':`₹${p.charges}`}</span></td>
                          <td className="px-5 py-3.5 text-gray-600">{p.deliveryTime||p.time||'—'}</td>
                          <td className="px-5 py-3.5 text-center">
                            {p.enabled!==false?<span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/>Active</span>
                            :<span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-400"/>Disabled</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={()=>openEdit(p)} className="w-7 h-7 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-gray-400 flex items-center justify-center"><Edit2 size={12}/></button>
                              <button onClick={()=>setConfirmDel(code)} className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center"><Trash2 size={12}/></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ConfirmDialog isOpen={!!confirmDel} title="Delete Pincode" message={`Remove pincode ${confirmDel}? Products assigned only to this pincode will become unavailable in that area.`} onConfirm={handleDelete} onCancel={()=>setConfirmDel(null)} confirmLabel="Delete"/>
    </div>
  );
}
