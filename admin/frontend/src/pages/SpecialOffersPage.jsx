import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, CheckCircle, Loader2, Gift, ArrowUp, ArrowDown } from 'lucide-react';
import { offersApi, categoriesApi, productsApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

function OfferModal({ isOpen, onClose, onSave, editing, categories, products }) {
  const { addToast } = useToast();
  const EMPTY = { title:'', subtitle:'', badgeText:'', buttonText:'SHOP NOW →', imageUrl:'', bgColor:'#ede9fe',
    offerType:'category', linkedCatId:'', linkedProdId:'', multiProdIds:[], startDate:'', endDate:'',
    status:'active', displayOrder:0 };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  useEffect(()=>{ if(isOpen) setForm(editing ? { ...EMPTY, ...editing, multiProdIds: editing.multiProdIds||[] } : EMPTY); },[editing,isOpen]);
  if(!isOpen) return null;
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const toggleProd=id=>setForm(p=>({...p,multiProdIds:p.multiProdIds.includes(id)?p.multiProdIds.filter(x=>x!==id):[...p.multiProdIds,id]}));
  const handleSave=async()=>{
    if(!form.title.trim()){addToast('Title required','error');return;}
    if(!form.imageUrl){addToast('Banner image URL required','error');return;}
    setSaving(true);
    try{await onSave(form,editing?.id);onClose();}
    catch(e){addToast(e.message,'error');}finally{setSaving(false);}
  };
  const fi='w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';
  return(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" style={{background:'rgba(15,23,42,0.6)',backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col animate-pop shadow-2xl" style={{maxHeight:'92vh'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-black text-gray-900">{editing?'Edit Offer':'Create Special Offer'}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X size={14}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Image URL */}
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Banner Image URL *</label>
            <input value={form.imageUrl} onChange={e=>set('imageUrl',e.target.value)} placeholder="https://images.unsplash.com/…" className={fi}/>
            {form.imageUrl&&<img src={form.imageUrl} alt="preview" className="mt-2 h-20 w-full object-cover rounded-xl border border-gray-200" onError={e=>{e.target.src='/logo.png'}}/>}
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Offer title" className={fi}/></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Subtitle</label>
            <input value={form.subtitle} onChange={e=>set('subtitle',e.target.value)} placeholder="Short description" className={fi}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Badge Text</label>
              <input value={form.badgeText} onChange={e=>set('badgeText',e.target.value)} placeholder="UP TO 30% OFF" className={fi}/></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Button Text</label>
              <input value={form.buttonText} onChange={e=>set('buttonText',e.target.value)} className={fi}/></div>
          </div>
          {/* BG Color */}
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Background Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {['#ede9fe','#dcfce7','#fef3c7','#fce7f3','#dbeafe','#ffedd5','#f0fdf4'].map(c=>(
                <button key={c} type="button" onClick={()=>set('bgColor',c)} className="w-8 h-8 rounded-full border-2 transition" style={{background:c,borderColor:form.bgColor===c?'#374151':'transparent',boxShadow:form.bgColor===c?'0 0 0 2px #374151':'none'}}/>
              ))}
              <input type="color" value={form.bgColor} onChange={e=>set('bgColor',e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border border-gray-200"/>
            </div>
          </div>
          {/* Offer Type */}
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Offer Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[['category','📂 Category'],['product','📦 Product'],['multi','🛒 Multi Products'],['general','🎉 General']].map(([v,l])=>(
                <button key={v} type="button" onClick={()=>set('offerType',v)} className="text-left p-3 rounded-xl border-2 transition" style={{borderColor:form.offerType===v?'#7c3aed':'#e5e7eb',background:form.offerType===v?'#f5f3ff':'#fff'}}>
                  <p className="text-xs font-bold text-gray-800">{l}</p>
                </button>
              ))}
            </div>
          </div>
          {form.offerType==='category'&&(
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Link to Category</label>
              <select value={form.linkedCatId} onChange={e=>set('linkedCatId',e.target.value)} className={fi+' cursor-pointer'}>
                <option value="">— Select —</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.emojiIcon||''} {c.name}</option>)}
              </select></div>
          )}
          {form.offerType==='product'&&(
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Link to Product</label>
              <select value={form.linkedProdId} onChange={e=>set('linkedProdId',e.target.value)} className={fi+' cursor-pointer'}>
                <option value="">— Select —</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
          )}
          {form.offerType==='multi'&&(
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Select Products ({form.multiProdIds.length})</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {products.map(p=>(
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                    <input type="checkbox" checked={form.multiProdIds.includes(p.id)} onChange={()=>toggleProd(p.id)} className="w-4 h-4 accent-primary rounded"/>
                    <span className="text-xs font-semibold text-gray-700 flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] text-gray-400">₹{p.price}</span>
                  </label>
                ))}
              </div></div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Start Date</label>
              <input type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} className={fi}/></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">End Date</label>
              <input type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)} className={fi}/></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={form.status} onChange={e=>set('status',e.target.value)} className={fi+' cursor-pointer'}>
                <option value="active">✅ Active</option><option value="inactive">🚫 Inactive</option><option value="scheduled">📅 Scheduled</option>
              </select></div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5" style={{background:'linear-gradient(135deg,#7c3aed,#9d5cf6)'}}>
            {saving?<Loader2 size={13} className="spin"/>:<CheckCircle size={13}/>}{saving?'Saving…':editing?'Update':'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SpecialOffersPage() {
  const { addToast } = useToast();
  const [offers,     setOffers]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(()=>{
    Promise.all([offersApi.getAll(), categoriesApi.getAll(), productsApi.getAll({status:'all'})])
      .then(([o,c,p])=>{ setOffers(o.data||[]); setCategories((c.data||[]).filter(x=>x.status==='published')); setProducts((p.data||[]).filter(x=>x.status==='published')); })
      .catch(e=>addToast(e.message,'error')).finally(()=>setLoading(false));
  },[]);

  const handleSave=async(form,id)=>{
    if(id){ const r=await offersApi.update(id,form); setOffers(prev=>prev.map(o=>o.id===id?r.data:o)); addToast('Offer updated','success'); }
    else  { const r=await offersApi.create(form);   setOffers(prev=>[r.data,...prev]); addToast('Offer created','success'); }
  };
  const handleDelete=async()=>{
    try{ await offersApi.delete(confirmDel); setOffers(prev=>prev.filter(o=>o.id!==confirmDel)); addToast('Deleted','success'); }
    catch(e){addToast(e.message,'error');} finally{setConfirmDel(null);}
  };
  const moveOrder=async(offer,dir)=>{ await offersApi.update(offer.id,{...offer,displayOrder:(offer.displayOrder||0)+dir}); setOffers(prev=>prev.map(o=>o.id===offer.id?{...o,displayOrder:(o.displayOrder||0)+dir}:o)); };
  const isActive=o=>{ const now=Date.now(); if(o.status!=='active') return false; if(o.endDate&&new Date(o.endDate).getTime()<now) return false; if(o.startDate&&new Date(o.startDate).getTime()>now) return false; return true; };
  const sorted=[...offers].sort((a,b)=>(a.displayOrder||999)-(b.displayOrder||999));

  if(loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

  return(
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <div><h1 className="text-lg font-black text-gray-900 flex items-center gap-2"><Gift size={18} className="text-violet-600"/>Special Offers</h1>
          <p className="text-xs text-gray-400 mt-0.5">{offers.length} offers · {offers.filter(isActive).length} active</p></div>
        <button onClick={()=>{setEditing(null);setModalOpen(true);}} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition" style={{background:'linear-gradient(135deg,#7c3aed,#9d5cf6)'}}>
          <Plus size={14}/> Add Offer</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {sorted.length===0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Gift size={40} className="text-gray-200 mb-3"/>
            <p className="text-sm font-bold text-gray-600">No special offers yet</p>
            <button onClick={()=>{setEditing(null);setModalOpen(true);}} className="mt-4 flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl" style={{background:'linear-gradient(135deg,#7c3aed,#9d5cf6)'}}><Plus size={12}/>Create First Offer</button>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map(offer=>{
              const active=isActive(offer);
              return(
                <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex shadow-sm">
                  <div className="w-1.5 flex-shrink-0 rounded-l-2xl" style={{background:active?'#7c3aed':offer.status==='scheduled'?'#d97706':'#9ca3af'}}/>
                  <div className="w-28 h-24 flex-shrink-0 overflow-hidden" style={{background:offer.bgColor||'#ede9fe'}}>
                    {offer.imageUrl ? <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" onError={e=>{e.target.src='/logo.png'}}/>
                      : <div className="w-full h-full flex items-center justify-center"><Gift size={24} className="text-violet-300"/></div>}
                  </div>
                  <div className="flex-1 px-4 py-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-black text-gray-900 truncate">{offer.title}</h3>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${active?'bg-emerald-100 text-emerald-700':offer.status==='scheduled'?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-500'}`}>
                            {active?'● Active':offer.status==='scheduled'?'📅 Scheduled':'○ Inactive'}
                          </span>
                        </div>
                        {offer.subtitle&&<p className="text-xs text-gray-500 truncate">{offer.subtitle}</p>}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {offer.badgeText&&<span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{background:'#7c3aed'}}>{offer.badgeText}</span>}
                          <span className="text-[10px] text-gray-400 capitalize">{offer.offerType} offer</span>
                          {(offer.startDate||offer.endDate)&&<span className="text-[10px] text-gray-400">{offer.startDate||'—'} → {offer.endDate||'—'}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={()=>moveOrder(offer,-1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"><ArrowUp size={11} className="text-gray-600"/></button>
                        <span className="text-[10px] font-black text-gray-400 text-center">{offer.displayOrder||0}</span>
                        <button onClick={()=>moveOrder(offer,1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"><ArrowDown size={11} className="text-gray-600"/></button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3 flex-shrink-0 justify-center">
                    <button onClick={()=>{setEditing(offer);setModalOpen(true);}} className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition"><Edit2 size={13}/></button>
                    <button onClick={()=>setConfirmDel(offer.id)} className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition"><Trash2 size={13}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <OfferModal isOpen={modalOpen} onClose={()=>{setModalOpen(false);setEditing(null);}} onSave={handleSave} editing={editing} categories={categories} products={products}/>
      <ConfirmDialog isOpen={!!confirmDel} title="Delete Offer" message="This offer will be removed from the user home page." onConfirm={handleDelete} onCancel={()=>setConfirmDel(null)} confirmLabel="Delete"/>
    </div>
  );
}
