import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Loader2, Search } from 'lucide-react';
import { productsApi } from '../services/api';
import { useToast } from '../components/Toast';

export default function InventoryPage() {
 const { addToast } = useToast();
 const [products, setProducts] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [filter, setFilter] = useState('all'); // all | out | low
 const [editId, setEditId] = useState(null);
 const [editVal, setEditVal] = useState('');
 const [saving, setSaving] = useState(false);

 const load = () => productsApi.getAll({ status:'all' }).then(r=>setProducts(r.data||[])).catch(e=>addToast(e.message,'error')).finally(()=>setLoading(false));
 useEffect(()=>{ load(); },[]);

 const visible = products.filter(p=>{
 const q=search.toLowerCase();
 const mq=!q||(p.name||'').toLowerCase().includes(q)||(p.sku||'').toLowerCase().includes(q);
 const s=Number(p.stock);
 const mf=filter==='all'||(filter==='out'&&s===0)||(filter==='low'&&s>0&&s<=(p.lowStockAlert||10));
 return mq&&mf;
 }).sort((a,b)=>Number(a.stock)-Number(b.stock));

 const saveStock = async (id) => {
 setSaving(true);
 try {
 await productsApi.updateStock(id, Number(editVal));
 setProducts(prev=>prev.map(p=>p.id===id?{...p,stock:Number(editVal)}:p));
 addToast('Stock updated','success'); setEditId(null);
 } catch(e){ addToast(e.message,'error'); } finally{ setSaving(false); }
 };

 if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

 const outCount = products.filter(p=>Number(p.stock)===0).length;
 const lowCount = products.filter(p=>Number(p.stock)>0&&Number(p.stock)<=(p.lowStockAlert||10)).length;

 return (
 <div className="flex flex-col h-full">
 <div className="px-4 sm:px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
 <h1 className="text-page-title text-gray-900">Inventory</h1>
 <p className="text-xs text-muted mt-0.5">{products.length} products · {outCount} out of stock · {lowCount} low stock</p>
 </div>
 {/* Alert cards */}
 {(outCount>0||lowCount>0)&&(
 <div className="flex gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 flex-shrink-0">
 {outCount>0&&<div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-3.5"><div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center"><AlertTriangle size={16} className="text-red-500"/></div><div><p className="text-xs font-medium text-red-700">{outCount} Out of Stock</p><p className="text-[10px] text-red-400">Needs restock immediately</p></div></div>}
 {lowCount>0&&<div className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 rounded-xl p-3.5"><div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center"><AlertTriangle size={16} className="text-yellow-500"/></div><div><p className="text-xs font-medium text-yellow-700">{lowCount} Low Stock</p><p className="text-[10px] text-yellow-500">Below alert threshold</p></div></div>}
 </div>
 )}
 <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100 flex-wrap flex-shrink-0">
 <div className="relative flex-1 min-w-[180px]">
 <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…" className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"/>
 </div>
 {[['all','All'],['out','Out of Stock'],['low','Low Stock']].map(([v,l])=>(
 <button key={v} onClick={()=>setFilter(v)} className={`px-3 py-1.5 rounded-full text-[10px] font-medium border transition ${filter===v?'bg-primary text-white border-primary':'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>{l}</button>
 ))}
 </div>
 <div className="flex-1 overflow-auto px-6 py-4">
 <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
 <table className="w-full text-xs min-w-[600px]">
 <thead><tr className="bg-gray-50 border-b border-gray-100">
 {['Product','SKU','Category','Current Stock','Alert Threshold','Status','Update Stock'].map(h=>(
 <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">{h}</th>
 ))}
 </tr></thead>
 <tbody className="divide-y divide-gray-50">
 {visible.length===0 ? <tr><td colSpan={7} className="text-center py-12 text-xs text-gray-400">No products found</td></tr>
 : visible.map(prod=>{
 const s=Number(prod.stock);
 const threshold=prod.lowStockAlert||10;
 const isOut=s===0;
 const isLow=s>0&&s<=threshold;
 return (
 <tr key={prod.id} className={`transition ${isOut?'bg-red-50/30':isLow?'bg-yellow-50/30':'hover:bg-gray-50/60'}`}>
 <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px]">
 <p className="truncate">{prod.name}</p>
 {prod.brand&&<p className="text-xs text-muted mt-0.5">{prod.brand}</p>}
 </td>
 <td className="px-4 py-3 font-mono text-gray-400 text-[10px]">{prod.sku||'—'}</td>
 <td className="px-4 py-3 text-gray-500">{prod.category||'—'}</td>
 <td className="px-4 py-3">
 <span className={`text-sm font-semibold ${isOut?'text-red-600':isLow?'text-yellow-600':'text-green-700'}`}>{s}</span>
 </td>
 <td className="px-4 py-3 text-gray-400">{threshold} units</td>
 <td className="px-4 py-3">
 {isOut ? <span className="text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Out of Stock</span>
 : isLow ? <span className="text-[10px] font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">Low Stock</span>
 : <span className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">In Stock</span>}
 </td>
 <td className="px-4 py-3">
 {editId===prod.id ? (
 <div className="flex items-center gap-1.5">
 <input type="number" min="0" value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus className="w-20 border border-primary rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"/>
 <button onClick={()=>saveStock(prod.id)} disabled={saving} className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white text-[10px] font-medium rounded-lg disabled:opacity-50">{saving?<Loader2 size={10} className="spin"/>:null}Save</button>
 <button onClick={()=>setEditId(null)} className="px-2.5 py-1.5 border border-gray-200 text-[10px] font-medium text-gray-500 rounded-lg hover:bg-gray-50">?</button>
 </div>
 ) : (
 <button onClick={()=>{setEditId(prod.id);setEditVal(String(s));}} className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary text-[10px] font-medium rounded-lg hover:bg-primary hover:text-white transition">
 <RefreshCw size={10}/>Update
 </button>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
