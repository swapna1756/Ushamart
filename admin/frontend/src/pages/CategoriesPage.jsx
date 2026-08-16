import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, CheckCircle, Loader2 } from 'lucide-react';
import { categoriesApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUploader from '../components/ImageUploader';

function CategoryModal({ isOpen, onClose, onSave, editing }) {
 const { addToast } = useToast();
 const EMPTY = { name:'', description:'', emojiIcon:'', icon:'', status:'published', featured:false, displayOrder:0 };
 const [form, setForm] = useState(EMPTY);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 if (isOpen) setForm(editing ? { ...EMPTY, ...editing } : EMPTY);
 }, [editing, isOpen]);

 if (!isOpen) return null;
 const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

 const handleSave = async () => {
 if (!form.name.trim()) { addToast('Name is required', 'error'); return; }
 setSaving(true);
 try { await onSave(form, editing?.id); onClose(); }
 catch (e) { addToast(e.message, 'error'); }
 finally { setSaving(false); }
 };

 const fi = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';
 return (
 <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" style={{background:'rgba(15,23,42,0.6)',backdropFilter:'blur(6px)'}} onClick={onClose}>
 <div className="bg-white rounded-3xl w-full max-w-md animate-pop shadow-2xl" onClick={e=>e.stopPropagation()}>
 <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
 <h2 className="text-sm font-semibold text-gray-900">{editing ? 'Edit Category' : 'New Category'}</h2>
 <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X size={14}/></button>
 </div>
 <div className="p-6 space-y-4">
 <div><label className="text-xs font-medium text-label block mb-1.5">Name *</label>
 <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Fruits & Vegetables" className={fi}/></div>
 <div><label className="text-xs font-medium text-label block mb-1.5">Description</label>
 <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2} className={fi+' resize-none'}/></div>
 <div className="grid grid-cols-2 gap-3">
 <div><label className="text-xs font-medium text-label block mb-1.5">Emoji Icon</label>
 <input value={form.emojiIcon} onChange={e=>set('emojiIcon',e.target.value)} placeholder="??" maxLength={4} className={fi}/></div>
 <div><label className="text-xs font-medium text-label block mb-1.5">Display Order</label>
 <input type="number" value={form.displayOrder} onChange={e=>set('displayOrder',e.target.value)} className={fi}/></div>
 </div>
 <div><label className="text-xs font-medium text-label block mb-1.5">Image URL</label>
 <input value={form.icon} onChange={e=>set('icon',e.target.value)} placeholder="https://…" className={fi}/>
 </div>
 <ImageUploader label="Or Upload Image" value={form.icon} onChange={url=>set('icon',url)} hint="JPG, PNG, WebP · Max 5 MB"/>
 <div className="grid grid-cols-2 gap-3">
 <div><label className="text-xs font-medium text-label block mb-1.5">Status</label>
 <select value={form.status} onChange={e=>set('status',e.target.value)} className={fi+' cursor-pointer'}>
 <option value="published">? Published</option>
 <option value="inactive">?? Inactive</option>
 </select></div>
 <div className="flex items-end pb-1">
 <label className="flex items-center gap-2 cursor-pointer">
 <div onClick={()=>set('featured',!form.featured)}
 className={`w-5 h-5 rounded border-2 flex items-center justify-center transition cursor-pointer ${form.featured?'bg-primary border-primary':'bg-white border-gray-300'}`}>
 {form.featured&&<CheckCircle size={12} className="text-white" strokeWidth={3}/>}
 </div>
 <span className="text-xs font-semibold text-gray-700">Featured</span>
 </label>
 </div>
 </div>
 </div>
 <div className="flex gap-3 px-6 pb-6">
 <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
 <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
 {saving?<Loader2 size={13} className="spin"/>:<CheckCircle size={13}/>}{saving?'Saving…':editing?'Update':'Create'}
 </button>
 </div>
 </div>
 </div>
 );
}

export default function CategoriesPage() {
 const navigate = useNavigate();
 const { addToast } = useToast();
 const [cats, setCats] = useState([]);
 const [loading, setLoading] = useState(true);
 const [modalOpen,setModalOpen]= useState(false);
 const [editing, setEditing] = useState(null);
 const [confirmDel,setConfirmDel]=useState(null);

 const load = () => categoriesApi.getAll().then(r=>setCats(r.data||[])).catch(e=>addToast(e.message,'error')).finally(()=>setLoading(false));
 useEffect(()=>{load();},[]);

 const handleSave = async (form, id) => {
 if (id) { const r=await categoriesApi.update(id,form); setCats(prev=>prev.map(c=>c.id===id?r.data:c)); addToast('Category updated','success'); }
 else { const r=await categoriesApi.create(form); setCats(prev=>[r.data,...prev]); addToast('Category created','success'); }
 };
 const handleToggle = async cat => {
 const next=cat.status==='published'?'inactive':'published';
 await categoriesApi.toggleStatus(cat.id,next);
 setCats(prev=>prev.map(c=>c.id===cat.id?{...c,status:next}:c));
 addToast(`Category ${next}`,'info');
 };
 const handleDelete = async () => {
 try { await categoriesApi.delete(confirmDel); setCats(prev=>prev.filter(c=>c.id!==confirmDel)); addToast('Category deleted','success'); }
 catch(e){addToast(e.message,'error');} finally{setConfirmDel(null);}
 };

 if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

 return (
 <div className="flex flex-col h-full">
 <div className="flex items-center justify-between px-4 sm:px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
 <div><h1 className="text-page-title text-gray-900">Categories</h1>
 <p className="text-xs text-muted mt-0.5">{cats.length} categories · {cats.filter(c=>c.status==='published').length} active</p></div>
 <button onClick={()=>navigate('/categories/add')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-primary hover:bg-primary-hover shadow-md transition">
 <Plus size={14}/> Add Category</button>
 </div>
 <div className="flex-1 overflow-y-auto p-4 sm:p-6">
 {cats.length===0 ? (
 <div className="flex flex-col items-center justify-center py-20 text-center">
 <p className="text-sm font-medium text-gray-600">No categories yet</p>
 <button onClick={()=>navigate('/categories/add')} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-medium rounded-xl"><Plus size={12}/>Create Category</button>
 </div>
 ) : (
 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {cats.map(cat=>(
 <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
 <div className="h-28 bg-gray-50 overflow-hidden relative">
 {cat.icon ? <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-5xl">{cat.emojiIcon||'??'}</div>}
 <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.status==='published'?'bg-green-500 text-white':'bg-gray-500 text-white'}`}>
 {cat.status==='published'?'Active':'Inactive'}
 </span>
 {cat.featured&&<span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-0.5 rounded-full">? Featured</span>}
 </div>
 <div className="p-3">
 <p className="text-sm font-semibold text-gray-900 truncate">{cat.emojiIcon&&cat.emojiIcon+' '}{cat.name}</p>
 {cat.description&&<p className="text-xs text-muted mt-0.5 line-clamp-1">{cat.description}</p>}
 <div className="flex items-center gap-1.5 mt-3">
 <button onClick={()=>navigate(`/categories/edit/${cat.id}`)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-[10px] font-medium hover:bg-blue-50 transition"><Edit2 size={10}/>Edit</button>
 <button onClick={()=>handleToggle(cat)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-yellow-200 text-yellow-600 text-[10px] font-medium hover:bg-yellow-50 transition">
 {cat.status==='published'?<><EyeOff size={10}/>Hide</>:<><Eye size={10}/>Show</>}
 </button>
 <button onClick={()=>setConfirmDel(cat.id)} className="w-8 flex items-center justify-center py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"><Trash2 size={10}/></button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 <CategoryModal isOpen={modalOpen} onClose={()=>{setModalOpen(false);setEditing(null);}} onSave={handleSave} editing={editing}/>
 <ConfirmDialog isOpen={!!confirmDel} title="Delete Category" message="Products in this category will lose their assignment." onConfirm={handleDelete} onCancel={()=>setConfirmDel(null)} confirmLabel="Delete"/>
 </div>
 );
}
