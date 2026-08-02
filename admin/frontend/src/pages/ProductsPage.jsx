import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, RefreshCw,
  ChevronLeft, ChevronRight, ArrowUpDown, Loader2, X, CheckCircle } from 'lucide-react';
import { productsApi, categoriesApi, pincodesApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUploader from '../components/ImageUploader';

/* ── Badges ── */
function StatusBadge({ status }) {
  const m = { published:'bg-green-50 text-green-700 border-green-200', draft:'bg-yellow-50 text-yellow-700 border-yellow-200', inactive:'bg-gray-100 text-gray-500 border-gray-200', hidden:'bg-purple-50 text-purple-700 border-purple-200' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${m[status]||m.draft}`}><span className={`w-1.5 h-1.5 rounded-full ${status==='published'?'bg-green-500':status==='draft'?'bg-yellow-400':'bg-gray-400'}`}/>{status}</span>;
}
function StockBadge({ stock }) {
  const s = Number(stock);
  if (s===0) return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Out of Stock</span>;
  if (s<=10) return <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">Low: {s}</span>;
  return <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">{s} units</span>;
}

/* ── Quick Stock Modal ── */
function StockModal({ product, onClose, onSave }) {
  const [val, setVal] = useState(product?.stock ?? 0);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  if (!product) return null;
  const save = async () => {
    setSaving(true);
    try { await onSave(product.id, Number(val)); addToast('Stock updated', 'success'); onClose(); }
    catch (e) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4" style={{background:'rgba(15,23,42,0.5)'}} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 animate-pop" onClick={e=>e.stopPropagation()}>
        <h3 className="text-sm font-black text-gray-900 mb-1">Update Stock</h3>
        <p className="text-xs text-gray-400 mb-4 truncate">{product.name}</p>
        <input type="number" min="0" value={val} onChange={e=>setVal(e.target.value)} autoFocus
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"/>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 size={13} className="spin"/> : <RefreshCw size={13}/>} Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Product Form Modal ── */
function ProductModal({ isOpen, onClose, onSave, editing, categories, pincodes }) {
  const { addToast } = useToast();
  const EMPTY = { name:'', brand:'', description:'', category:'', unit:'500g', mrp:'', price:'',
    stock:'', sku:'', barcode:'', expiryDate:'', status:'published', images:[],
    featured:false, bestSeller:false, newArrival:false, trending:false, todayOffer:false,
    pincodesAvailable:[], gst:'5', lowStockAlert:'10', deliveryTime:'1-2 Days', cod:true };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setForm({ ...EMPTY, ...editing, pincodesAvailable: editing.pincodesAvailable || [] });
    } else {
      setForm({ ...EMPTY,
        sku: 'UM-' + Math.random().toString(36).substring(2,8).toUpperCase(),
        category: categories[0]?.id || '',
        pincodesAvailable: pincodes.map(p => p.code || p.id || p),
      });
    }
  }, [editing, isOpen]);

  if (!isOpen) return null;

  const set = (k, v) => setForm(p => {
    const n = { ...p, [k]: v };
    if (k === 'mrp' || k === 'price') {
      const m = parseFloat(k==='mrp' ? v : p.mrp) || 0;
      const pr = parseFloat(k==='price' ? v : p.price) || 0;
      n.discountPercent = m > 0 && pr > 0 && m > pr ? Math.round(((m-pr)/m)*100) : 0;
    }
    if (k === 'status') n.availabilityStatus = v;
    return n;
  });

  // Add image URL to product images array
  const addImageUrl = (url) => {
    if (url && !form.images.includes(url)) set('images', [...form.images, url]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Product name is required', 'error'); return; }
    if (!form.category)    { addToast('Category is required', 'error'); return; }
    if (!form.price)       { addToast('Price is required', 'error'); return; }
    setSaving(true);
    try { await onSave(form, editing?.id); onClose(); }
    catch (e) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const fi = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-white';

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{background:'rgba(15,23,42,0.6)',backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full flex flex-col animate-pop"
        style={{maxWidth:'660px',maxHeight:'92vh',boxShadow:'0 32px 80px rgba(0,0,0,0.28)'}}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">
              {editing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{editing ? 'Update product details' : 'Fill details to add a product'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X size={14} className="text-gray-500"/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Name *</label>
              <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Product name" className={fi}/></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Brand</label>
              <input value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="Brand" className={fi}/></div>
          </div>

          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)}
              rows={2} className={fi+' resize-none'} placeholder="Product description"/></div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Category *</label>
              <select value={form.category} onChange={e=>set('category',e.target.value)} className={fi+' cursor-pointer'}>
                <option value="">Select…</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.emojiIcon||''} {c.name}</option>)}
              </select></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Unit / Size</label>
              <input value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="500g, 1L, Pack…" className={fi}/></div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[['MRP (₹)','mrp'],['Price (₹)','price'],['Stock','stock']].map(([lbl,k])=>(
              <div key={k}><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">{lbl}</label>
                <input type="number" min="0" value={form[k]} onChange={e=>set(k,e.target.value)} className={fi}/></div>
            ))}
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Discount %</label>
              <input value={(form.discountPercent||0)+'%'} readOnly
                className={fi+' bg-gray-50 text-center font-bold text-primary cursor-default'}/></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">SKU</label>
              <input value={form.sku} onChange={e=>set('sku',e.target.value)} className={fi}/></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Barcode</label>
              <input value={form.barcode||''} onChange={e=>set('barcode',e.target.value)} className={fi}/></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Expiry Date</label>
              <input type="date" value={form.expiryDate||''} onChange={e=>set('expiryDate',e.target.value)} className={fi}/></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Attributes */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Attributes</p>
              {[['featured','Featured'],['bestSeller','Best Seller'],['newArrival','New Arrival'],['trending','Trending'],['todayOffer',"Today's Offer"]].map(([k,lbl])=>(
                <label key={k} className="flex items-center gap-2 cursor-pointer mb-2">
                  <div onClick={()=>set(k,!form[k])}
                    className={`w-4 h-4 rounded flex items-center justify-center border-2 transition cursor-pointer ${form[k]?'bg-primary border-primary':'bg-white border-gray-300'}`}>
                    {form[k]&&<CheckCircle size={10} className="text-white" strokeWidth={3}/>}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{lbl}</span>
                </label>
              ))}
            </div>

            {/* Status + Pincodes */}
            <div className="space-y-3">
              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)} className={fi+' cursor-pointer'}>
                  <option value="published">✅ Published</option>
                  <option value="inactive">🚫 Inactive</option>
                  <option value="draft">🕐 Draft</option>
                  <option value="hidden">📝 Hidden</option>
                </select></div>
              {pincodes.length > 0 && (
                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Available Pincodes</label>
                  <div className="flex flex-wrap gap-1.5 border border-gray-200 rounded-xl p-2 bg-white min-h-[40px]">
                    {pincodes.map(p=>{
                      const code=p.code||p.id||p;
                      const active=form.pincodesAvailable.includes(code);
                      return <button key={code} type="button" onClick={()=>set('pincodesAvailable',active?form.pincodesAvailable.filter(x=>x!==code):[...form.pincodesAvailable,code])}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${active?'bg-primary text-white border-primary':'bg-gray-50 text-gray-500 border-gray-200'}`}>{code}</button>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Images — using ImageUploader (supports upload + URL) */}
          <div className="space-y-3">
            <ImageUploader
              label="Main Product Image"
              value={form.images[0] || ''}
              onChange={url => {
                if (!url) { set('images', form.images.slice(1)); return; }
                const imgs = [...form.images];
                imgs[0] = url;
                set('images', imgs);
              }}
              hint="JPG, PNG, WebP · Max 5 MB · This is the main display image"
            />
            {/* Additional images */}
            {form.images.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  All Images ({form.images.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((img,i)=>(
                    <div key={i} className="relative w-[72px] h-[72px] rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={img} alt="" className="w-full h-full object-cover" onError={e=>e.target.src='/logo.png'}/>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                        <button type="button" onClick={()=>set('images',form.images.filter((_,j)=>j!==i))}
                          className="opacity-0 group-hover:opacity-100 transition text-[9px] font-bold text-white bg-red-500 px-1.5 py-1 rounded-lg">✕</button>
                      </div>
                      {i===0&&<span className="absolute top-1 left-1 bg-primary text-white text-[8px] font-bold px-1 py-0.5 rounded">Main</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Add more images */}
            <ImageUploader
              label="Add More Images"
              value=""
              onChange={url => { if(url) set('images', [...form.images, url]); }}
              hint="Add additional product images"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 pb-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-wide">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl text-xs font-bold text-white uppercase tracking-wide flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{background:saving?'#93c5fd':'linear-gradient(135deg,#2563EB,#3B82F6)',boxShadow:'0 4px 16px rgba(37,99,235,0.35)'}}>
            {saving?<Loader2 size={14} className="spin"/>:<CheckCircle size={14}/>}
            {saving?'Saving…':editing?'Update Product':'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ProductsPage() {
  const { addToast } = useToast();
  const [products, setProducts]   = useState([]);
  const [categories,setCategories]= useState([]);
  const [pincodes, setPincodes]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat,    setFilterCat]    = useState('all');
  const [sortKey,  setSortKey]    = useState('updatedAt');
  const [sortDir,  setSortDir]    = useState('desc');
  const [page,     setPage]       = useState(1);
  const [modalOpen,setModalOpen]  = useState(false);
  const [editing,  setEditing]    = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [stockProd,  setStockProd]  = useState(null);
  const PER = 12;

  const load = async () => {
    try {
      const [p, c, pins] = await Promise.all([
        productsApi.getAll({ status: 'all' }),
        categoriesApi.getAll(),
        pincodesApi.getAll(),
      ]);
      setProducts(p.data || []);
      setCategories((c.data || []).filter(c => c.status === 'published'));
      setPincodes(pins.data || []);
    } catch (e) { addToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const mq = !q || (p.name||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q);
    const ms = filterStatus === 'all' || p.status === filterStatus;
    const mc = filterCat    === 'all' || p.category === filterCat;
    return mq && ms && mc;
  }).sort((a, b) => {
    let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const total = Math.max(1, Math.ceil(filtered.length / PER));
  const paged = filtered.slice((page - 1) * PER, page * PER);
  const toggleSort = k => { if (sortKey===k) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortKey(k); setSortDir('asc'); }};

  const getCatName = id => categories.find(c => c.id === id)?.name || '—';

  const handleSave = async (form, editId) => {
    if (editId) {
      const res = await productsApi.update(editId, form);
      setProducts(prev => prev.map(p => p.id === editId ? res.data : p));
      addToast('Product updated', 'success');
    } else {
      const res = await productsApi.create(form);
      setProducts(prev => [res.data, ...prev]);
      addToast('Product created', 'success');
    }
  };

  const handleDelete = async () => {
    try {
      await productsApi.delete(confirmDel);
      setProducts(prev => prev.filter(p => p.id !== confirmDel));
      addToast('Product deleted', 'success');
    } catch (e) { addToast(e.message, 'error'); }
    finally { setConfirmDel(null); }
  };

  const handleToggle = async prod => {
    const next = prod.status === 'published' ? 'inactive' : 'published';
    const res = await productsApi.toggleStatus(prod.id, next);
    setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, status: next } : p));
    addToast(`Product ${next}`, 'info');
  };

  const handleStockSave = async (id, stock) => {
    await productsApi.updateStock(id, stock);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock } : p));
  };

  const SI = ({ k }) => <ArrowUpDown size={10} className={sortKey===k?'text-primary':'text-gray-300'}/>;

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin"/></div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <div>
          <h1 className="text-lg font-black text-gray-900">Products</h1>
          <p className="text-xs text-gray-400 mt-0.5">{products.length} products · {products.filter(p=>p.status==='published').length} published</p>
        </div>
        <button onClick={()=>{setEditing(null);setModalOpen(true);}}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition">
          <Plus size={14}/> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100 flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search products, brands, SKU…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"/>
        </div>
        <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}} className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-medium text-gray-700">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={filterCat} onChange={e=>{setFilterCat(e.target.value);setPage(1);}} className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-medium text-gray-700">
          <option value="all">All Categories</option>
          {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase w-12">Image</th>
                {[['name','Product'],['brand','Brand'],['category','Category']].map(([k,l])=>(
                  <th key={k} onClick={()=>toggleSort(k)} className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase cursor-pointer hover:text-gray-700 select-none">
                    <span className="flex items-center gap-1">{l}<SI k={k}/></span>
                  </th>
                ))}
                <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Unit</th>
                <th onClick={()=>toggleSort('mrp')} className="px-3 py-3 text-right text-[10px] font-black text-gray-400 uppercase cursor-pointer select-none"><span className="flex items-center justify-end gap-1">MRP<SI k="mrp"/></span></th>
                <th onClick={()=>toggleSort('price')} className="px-3 py-3 text-right text-[10px] font-black text-gray-400 uppercase cursor-pointer select-none"><span className="flex items-center justify-end gap-1">Price<SI k="price"/></span></th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Disc%</th>
                <th onClick={()=>toggleSort('stock')} className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase cursor-pointer select-none"><span className="flex items-center justify-center gap-1">Stock<SI k="stock"/></span></th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Status</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-16 text-gray-400">
                  <p className="text-xs font-semibold">No products found</p>
                  {products.length === 0 && <button onClick={()=>{setEditing(null);setModalOpen(true);}} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"><Plus size={12}/> Add first product</button>}
                </td></tr>
              ) : paged.map(prod => {
                const disc = prod.mrp > prod.price ? Math.round(((prod.mrp-prod.price)/prod.mrp)*100) : 0;
                const img  = prod.images?.[0];
                return (
                  <tr key={prod.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-3 py-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                        {img ? <img src={img} alt={prod.name} className="w-full h-full object-cover" onError={e=>{e.target.src='/logo.png'}}/> : <img src="/logo.png" alt={prod.name} className="w-full h-full object-contain p-1"/>}
                      </div>
                    </td>
                    <td className="px-3 py-3 max-w-[150px]">
                      <p className="font-bold text-gray-800 truncate">{prod.name}</p>
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">{prod.sku||'—'}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{prod.brand||'—'}</td>
                    <td className="px-3 py-3 text-gray-500">{getCatName(prod.category)}</td>
                    <td className="px-3 py-3 text-gray-400">{prod.unit||'—'}</td>
                    <td className="px-3 py-3 text-right text-gray-500">{prod.mrp?`₹${prod.mrp}`:'—'}</td>
                    <td className="px-3 py-3 text-right font-bold text-gray-800">{prod.price?`₹${prod.price}`:'—'}</td>
                    <td className="px-3 py-3 text-center">{disc>0?<span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">{disc}%</span>:<span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-center"><StockBadge stock={prod.stock}/></td>
                    <td className="px-3 py-3 text-center"><StatusBadge status={prod.status}/></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={()=>{setEditing(prod);setModalOpen(true);}} title="Edit" className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition"><Edit2 size={12}/></button>
                        <button onClick={()=>setStockProd(prod)} title="Update stock" className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition"><RefreshCw size={12}/></button>
                        <button onClick={()=>handleToggle(prod)} title="Toggle status" className="w-7 h-7 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-600 flex items-center justify-center transition">{prod.status==='published'?<ToggleRight size={12}/>:<ToggleLeft size={12}/>}</button>
                        <button onClick={()=>setConfirmDel(prod.id)} title="Delete" className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition"><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>{filtered.length} results · Page {page} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ChevronLeft size={14}/></button>
            {Array.from({length:Math.min(5,total)},(_,i)=>{
              const p=Math.max(1,Math.min(total-4,page-2))+i;
              return <button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-lg border text-xs font-bold ${p===page?'bg-primary text-white border-primary':'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>{p}</button>;
            })}
            <button onClick={()=>setPage(p=>Math.min(total,p+1))} disabled={page===total} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      <ProductModal isOpen={modalOpen} onClose={()=>{setModalOpen(false);setEditing(null);}} onSave={handleSave}
        editing={editing} categories={categories} pincodes={pincodes}/>
      <StockModal product={stockProd} onClose={()=>setStockProd(null)} onSave={handleStockSave}/>
      <ConfirmDialog isOpen={!!confirmDel} title="Delete Product"
        message="This will permanently delete the product from the database." onConfirm={handleDelete}
        onCancel={()=>setConfirmDel(null)} confirmLabel="Delete"/>
    </div>
  );
}
