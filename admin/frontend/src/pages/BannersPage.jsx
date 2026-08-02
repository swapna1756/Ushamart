import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, CheckCircle, Loader2, Megaphone, ToggleLeft, ToggleRight } from 'lucide-react';
import { bannersApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUploader from '../components/ImageUploader';

function BannerModal({ isOpen, onClose, onSave, editing }) {
  const { addToast } = useToast();
  const EMPTY = { title:'', subtitle:'', badgeText:'', buttonText:'Shop Now', imageUrl:'', bgColor:'#dcfce7', active:true, displayOrder:0 };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  useEffect(()=>{ if(isOpen) setForm(editing ? { ...EMPTY, ...editing } : EMPTY); },[editing,isOpen]);
  if(!isOpen) return null;
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handleSave=async()=>{
    if(!form.title.trim()){addToast('Title required','error');return;}
    setSaving(true);
    try{await onSave(form,editing?.id);onClose();}
    catch(e){addToast(e.message,'error');}finally{setSaving(false);}
  };
  const fi='w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';
  return(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" style={{background:'rgba(15,23,42,0.6)',backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md animate-pop shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-sm font-black text-gray-900">{editing?'Edit Banner':'New Banner'}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-4">
          <ImageUploader
            label="Banner Image"
            value={form.imageUrl}
            onChange={url => set('imageUrl', url)}
            hint="JPG, PNG, WebP · Max 5 MB · Recommended: 800×400px"
          />
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Banner title" className={fi}/></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Subtitle</label>
            <input value={form.subtitle} onChange={e=>set('subtitle',e.target.value)} placeholder="Supporting text" className={fi}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Badge</label>
              <input value={form.badgeText} onChange={e=>set('badgeText',e.target.value)} placeholder="SPECIAL" className={fi}/></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Button</label>
              <input value={form.buttonText} onChange={e=>set('buttonText',e.target.value)} className={fi}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">BG Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.bgColor} onChange={e=>set('bgColor',e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200"/>
                <span className="text-xs text-gray-500 font-mono">{form.bgColor}</span>
              </div>
            </div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Order</label>
              <input type="number" value={form.displayOrder} onChange={e=>set('displayOrder',e.target.value)} className={fi}/></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={()=>set('active',!form.active)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition cursor-pointer ${form.active?'bg-primary border-primary':'bg-white border-gray-300'}`}>
              {form.active&&<CheckCircle size={12} className="text-white" strokeWidth={3}/>}
            </div>
            <span className="text-xs font-semibold text-gray-700">Active (visible to users)</span>
          </label>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving?<Loader2 size={13} className="spin"/>:<CheckCircle size={13}/>}{saving?'Saving…':editing?'Update':'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BannersPage() {
  const { addToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen,setModalOpen]=useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel,setConfirmDel]=useState(null);

  const load=()=>bannersApi.getAll().then(r=>setBanners(r.data||[])).catch(e=>addToast(e.message,'error')).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const handleSave=async(form,id)=>{
    if(id){ const r=await bannersApi.update(id,form); setBanners(prev=>prev.map(b=>b.id===id?r.data:b)); addToast('Banner updated','success'); }
    else  { const r=await bannersApi.create(form);   setBanners(prev=>[r.data,...prev]); addToast('Banner created','success'); }
  };
  const handleDelete=async()=>{
    try{ await bannersApi.delete(confirmDel); setBanners(prev=>prev.filter(b=>b.id!==confirmDel)); addToast('Deleted','success'); }
    catch(e){addToast(e.message,'error');} finally{setConfirmDel(null);}
  };
  const toggleActive=async(b)=>{
    const r=await bannersApi.update(b.id,{...b,active:!b.active});
    setBanners(prev=>prev.map(x=>x.id===b.id?{...x,active:!x.active}:x));
    addToast(`Banner ${!b.active?'activated':'deactivated'}`,'info');
  };

  if(loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

  return(
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <div><h1 className="text-lg font-black text-gray-900 flex items-center gap-2"><Megaphone size={18} className="text-blue-500"/>Banners</h1>
          <p className="text-xs text-gray-400 mt-0.5">{banners.length} banners · {banners.filter(b=>b.active).length} active</p></div>
        <button onClick={()=>{setEditing(null);setModalOpen(true);}} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition">
          <Plus size={14}/> Add Banner</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {banners.length===0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Megaphone size={40} className="text-gray-200 mb-3"/>
            <p className="text-sm font-bold text-gray-600">No banners yet</p>
            <button onClick={()=>{setEditing(null);setModalOpen(true);}} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"><Plus size={12}/>Create Banner</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {banners.sort((a,b)=>(a.displayOrder||0)-(b.displayOrder||0)).map(b=>(
              <div key={b.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${b.active?'border-green-100':'border-gray-100 opacity-70'}`}>
                <div className="h-32 overflow-hidden relative" style={{background:b.bgColor||'#dcfce7'}}>
                  {b.imageUrl&&<img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" onError={e=>{e.target.src='/logo.png'}}/>}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent flex items-end p-3">
                    <div>
                      {b.badgeText&&<span className="text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">{b.badgeText}</span>}
                      <p className="text-white font-black text-sm mt-1 drop-shadow">{b.title}</p>
                      {b.subtitle&&<p className="text-white/80 text-[10px] mt-0.5">{b.subtitle}</p>}
                    </div>
                  </div>
                  <span className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full ${b.active?'bg-green-500 text-white':'bg-gray-500 text-white'}`}>{b.active?'Active':'Inactive'}</span>
                </div>
                <div className="p-3 flex items-center gap-2">
                  <p className="flex-1 text-xs text-gray-500">Order: {b.displayOrder||0} · {b.buttonText}</p>
                  <button onClick={()=>toggleActive(b)} className="w-8 h-8 rounded-lg hover:bg-yellow-50 text-yellow-600 flex items-center justify-center transition">{b.active?<ToggleRight size={14}/>:<ToggleLeft size={14}/>}</button>
                  <button onClick={()=>{setEditing(b);setModalOpen(true);}} className="w-8 h-8 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center justify-center transition"><Edit2 size={13}/></button>
                  <button onClick={()=>setConfirmDel(b.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition"><Trash2 size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BannerModal isOpen={modalOpen} onClose={()=>{setModalOpen(false);setEditing(null);}} onSave={handleSave} editing={editing}/>
      <ConfirmDialog isOpen={!!confirmDel} title="Delete Banner" message="This banner will be removed from the user app." onConfirm={handleDelete} onCancel={()=>setConfirmDel(null)} confirmLabel="Delete"/>
    </div>
  );
}
