import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Search, Download, Upload, Edit2, Trash2, Copy,
  ToggleLeft, ToggleRight, X, Package, CheckCircle,
  ChevronLeft, ChevronRight, ArrowUpDown, AlertCircle,
  Loader2, ImagePlus, Save, MoreVertical
} from 'lucide-react';
import { getProductImage } from '../UserApp';
import { ConfirmDialog } from './ConfirmDialog';

// ─── shared styles (used by page-level UI only) ───────────────────────────────
const inp = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition placeholder:text-gray-400";
const sel = inp + " cursor-pointer appearance-none";

function Label({ children, required }) {
  return (
    <p className="text-xs text-gray-500 mb-1.5 font-medium">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </p>
  );
}
function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-5 ${className}`}>
      {title && <h3 className="text-sm font-bold text-gray-900 mb-4">{title}</h3>}
      {children}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = {
    published: 'bg-green-50 text-green-700 border-green-200',
    draft:     'bg-yellow-50 text-yellow-700 border-yellow-200',
    inactive:  'bg-gray-100 text-gray-500 border-gray-200',
    hidden:    'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${m[status] || m.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'published' ? 'bg-green-500' : status === 'draft' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
      {status}
    </span>
  );
}
function StockBadge({ stock }) {
  const s = Number(stock);
  if (s === 0)  return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Out of Stock</span>;
  if (s <= 10)  return <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">Low: {s}</span>;
  return <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">{s} units</span>;
}

// ─── VariantRow (kept for data compat — not shown in new modal) ───────────────
function VariantRow({ v, i, onChange, onRemove }) {
  const disc = v.mrp > 0 && v.price > 0 ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
  return (
    <div className="grid grid-cols-5 gap-2 items-end bg-gray-50 rounded-xl p-3 border border-gray-200">
      {[['Name','name','text','e.g. 500g'],['MRP ₹','mrp','number',''],['Price ₹','price','number',''],['Stock','stock','number','']].map(([lbl,key,type,ph]) => (
        <div key={key}>
          <Label>{lbl}</Label>
          <input type={type} value={v[key]||''} placeholder={ph} onChange={e => onChange(i, key, e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white" />
        </div>
      ))}
      <div className="flex items-center gap-1.5 pb-0.5">
        {disc > 0 && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-1 rounded-lg">{disc}%</span>}
        <button type="button" onClick={() => onRemove(i)} className="ml-auto text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Premium Product Form Modal ───────────────────────────────────────────────
const UNIT_PRESETS = ['250g','500g','1kg','2kg','5kg','100ml','250ml','500ml','1L','2L','Pack','Piece','Dozen'];

function ProductFormModal({ isOpen, onClose, onSave, editingProduct, categories, pincodes, addToast }) {
  const EMPTY = {
    name:'', brand:'', description:'', category:'',
    unitPreset:'500g', unit:'',
    mrp:'', price:'', discountPercent:'',
    stock:'', sku:'', barcode:'', expiryDate:'',
    availabilityStatus:'published', status:'published',
    images:[],
    featured:false, bestSeller:false, newArrival:false, trending:false, todayOffer:false,
    // legacy compat
    subcategory:'', specifications:'', variantList:[], gst:'5',
    lowStockAlert:'10', outOfStock:false,
    pincodesAvailable:[], deliveryCharge:'0', deliveryTime:'1-2 Days', cod:true,
  };

  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [imgErr,  setImgErr]  = useState('');
  const [imgBusy, setImgBusy] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingProduct) {
      setForm({
        ...EMPTY, ...editingProduct,
        variantList:       editingProduct.variantList       || [],
        pincodesAvailable: editingProduct.pincodesAvailable || [],
        unitPreset:        editingProduct.unitPreset || editingProduct.unit || '500g',
        availabilityStatus: editingProduct.availabilityStatus || editingProduct.status || 'published',
        featured:   editingProduct.featured   ?? false,
        bestSeller: editingProduct.bestSeller ?? false,
        newArrival: editingProduct.newArrival ?? false,
        trending:   editingProduct.trending   ?? false,
        todayOffer: editingProduct.todayOffer ?? false,
      });
    } else {
      setForm({
        ...EMPTY,
        sku: 'UM-PROD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        category: categories[0]?.id || '',
        pincodesAvailable: [...pincodes],
      });
    }
    setImgErr('');
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  // field setter — auto-discount + status sync
  const set = (key, val) => setForm(prev => {
    const next = { ...prev, [key]: val };
    if (key === 'mrp' || key === 'price') {
      const m = parseFloat(key === 'mrp'   ? val : prev.mrp)   || 0;
      const p = parseFloat(key === 'price' ? val : prev.price) || 0;
      next.discountPercent = (m > 0 && p > 0 && m > p) ? Math.round(((m - p) / m) * 100) : '';
    }
    if (key === 'availabilityStatus') next.status = val;
    if (key === 'unitPreset')         next.unit   = val;
    return next;
  });

  // image upload handler
  const processImages = async (files) => {
    if (!files?.length) return;
    setImgErr(''); setImgBusy(true);
    const urls = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) { setImgErr('Only image files are supported.'); continue; }
      if (f.size > 5 * 1024 * 1024)    { setImgErr(`${f.name} exceeds 5 MB.`);         continue; }
      const url = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result);
        r.onerror   = rej;
        r.readAsDataURL(f);
      });
      urls.push(url);
    }
    setImgBusy(false);
    if (urls.length) set('images', [...form.images, ...urls]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Product name is required',     'error'); return; }
    if (!form.category)    { addToast('Please select a category',     'error'); return; }
    if (!form.price)       { addToast('Selling price is required',    'error'); return; }
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  // input styles scoped to the modal (blue focus rings to match reference)
  const fi  = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition placeholder:text-gray-400 bg-white';
  const fis = fi + ' cursor-pointer appearance-none';
  const lbl = 'block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full flex flex-col animate-pop"
        style={{ maxWidth: '680px', maxHeight: '92vh', boxShadow: '0 32px 80px rgba(0,0,0,0.28)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '900', color: '#111', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
              {editingProduct ? 'Edit Product' : 'Create New Product'}
            </h2>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              {editingProduct ? 'Update product details.' : 'Fill in the details to add a new product.'}
            </p>
          </div>
          <button onClick={onClose}
            style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={14} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">

          {/* Row 1: Product Name + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Product Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Fresh Organic Apples" className={fi} />
            </div>
            <div>
              <label className={lbl}>Brand <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.brand} onChange={e => set('brand', e.target.value)}
                placeholder="EcoFarms" className={fi} />
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label className={lbl}>Description <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Rich in fiber and vitamins, imported fresh…"
              className={fi + ' resize-none'} />
          </div>

          {/* Row 3: Category + Unit Preset + Weight/Volume */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Category <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={fis}>
                  <option value="">Select…</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.emojiIcon ? c.emojiIcon + ' ' : ''}{c.name}
                    </option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '10px', pointerEvents: 'none' }}>▾</span>
              </div>
            </div>
            <div>
              <label className={lbl}>Unit Preset</label>
              <div style={{ position: 'relative' }}>
                <select value={form.unitPreset} onChange={e => set('unitPreset', e.target.value)} className={fis}>
                  {UNIT_PRESETS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '10px', pointerEvents: 'none' }}>▾</span>
              </div>
            </div>
            <div>
              <label className={lbl}>Weight / Volume</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)}
                placeholder={form.unitPreset || '500g'} className={fi} />
            </div>
          </div>

          {/* Row 4: MRP + Offer Price + Discount + Stock */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={lbl}>MRP (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '11px', fontWeight: '600' }}>₹</span>
                <input type="number" min="0" value={form.mrp} onChange={e => set('mrp', e.target.value)}
                  placeholder="120" className={fi} style={{ paddingLeft: '24px' }} />
              </div>
            </div>
            <div>
              <label className={lbl}>Offer Price (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '11px', fontWeight: '600' }}>₹</span>
                <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                  placeholder="99" className={fi} style={{ paddingLeft: '24px' }} />
              </div>
            </div>
            <div>
              <label className={lbl}>Discount %</label>
              <input
                value={form.discountPercent ? form.discountPercent + '%' : '0%'}
                readOnly
                className={fi}
                style={{ background: '#f9fafb', textAlign: 'center', fontWeight: '700', color: '#2563eb', cursor: 'default' }}
              />
            </div>
            <div>
              <label className={lbl}>Stock Quantity</label>
              <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)}
                placeholder="50" className={fi} />
            </div>
          </div>

          {/* Savings callout */}
          {Number(form.mrp) > 0 && Number(form.price) > 0 && Number(form.mrp) > Number(form.price) && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Customer saves</span>
              <span style={{ fontSize: '13px', color: '#15803d', fontWeight: '800' }}>
                ₹{(Number(form.mrp) - Number(form.price)).toFixed(0)} ({form.discountPercent}% off)
              </span>
            </div>
          )}

          {/* Row 5: SKU + Barcode + Expiry */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>SKU</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)}
                placeholder="UM-PROD-UNCRY" className={fi} />
            </div>
            <div>
              <label className={lbl}>Barcode (optional)</label>
              <input value={form.barcode || ''} onChange={e => set('barcode', e.target.value)}
                placeholder="890123456789" className={fi} />
            </div>
            <div>
              <label className={lbl}>Expiry Date (optional)</label>
              <input type="date" value={form.expiryDate || ''} onChange={e => set('expiryDate', e.target.value)}
                className={fi} />
            </div>
          </div>

          {/* Row 6: Product Attributes + Availability Status */}
          <div className="grid grid-cols-2 gap-4">
            {/* Attributes */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '14px 16px' }}>
              <p className={lbl} style={{ marginBottom: '10px' }}>Product Attributes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {[
                  ['featured',   'Featured Product'],
                  ['bestSeller', 'Best Seller'],
                  ['newArrival', 'New Arrival'],
                  ['trending',   'Trending Product'],
                  ['todayOffer', "Today's Offer"],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer' }}>
                    <div
                      onClick={() => set(key, !form[key])}
                      style={{
                        width: '16px', height: '16px', borderRadius: '5px', flexShrink: 0,
                        border: form[key] ? '2px solid #2563eb' : '2px solid #d1d5db',
                        background: form[key] ? '#2563eb' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease', cursor: 'pointer',
                      }}
                    >
                      {form[key] && <CheckCircle size={10} style={{ color: '#fff' }} strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability + Pincodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className={lbl}>Availability Status</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.availabilityStatus} onChange={e => set('availabilityStatus', e.target.value)} className={fis}>
                    <option value="published">✅ In Stock (Published)</option>
                    <option value="inactive">🚫 Out of Stock</option>
                    <option value="draft">🕐 Coming Soon</option>
                    <option value="hidden">📝 Draft (Hidden)</option>
                  </select>
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '10px', pointerEvents: 'none' }}>▾</span>
                </div>
              </div>

              {pincodes.length > 0 && (
                <div>
                  <label className={lbl}>Available Pincodes</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff', minHeight: '42px' }}>
                    {pincodes.map(pin => {
                      const active = form.pincodesAvailable.includes(pin);
                      return (
                        <button key={pin} type="button"
                          onClick={() => {
                            const has = form.pincodesAvailable.includes(pin);
                            set('pincodesAvailable', has ? form.pincodesAvailable.filter(p => p !== pin) : [...form.pincodesAvailable, pin]);
                          }}
                          style={{
                            padding: '2px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                            border: active ? '1px solid #2563eb' : '1px solid #e5e7eb',
                            background: active ? '#2563eb' : '#f9fafb',
                            color: active ? '#fff' : '#6b7280',
                            transition: 'all 0.15s',
                          }}>
                          {pin}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 7: Product Images */}
          <div>
            <label className={lbl}>Product Images Upload (multiple images)</label>
            {imgErr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px' }}>
                <AlertCircle size={12} /> {imgErr}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {/* Upload tile */}
              <div
                onClick={() => !imgBusy && imgRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); processImages(e.dataTransfer.files); }}
                style={{
                  width: '76px', height: '76px', borderRadius: '14px', flexShrink: 0,
                  border: '2px dashed', borderColor: imgBusy ? '#93c5fd' : '#d1d5db',
                  background: imgBusy ? '#eff6ff' : '#f9fafb',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: imgBusy ? 'default' : 'pointer', transition: 'all 0.2s', pointerEvents: imgBusy ? 'none' : 'auto',
                }}
                onMouseEnter={e => { if (!imgBusy) { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.background = '#eff6ff'; } }}
                onMouseLeave={e => { if (!imgBusy) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb'; } }}
              >
                <input ref={imgRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { processImages(e.target.files); e.target.value = ''; }} />
                {imgBusy
                  ? <Loader2 size={18} style={{ color: '#3b82f6' }} className="animate-spin" />
                  : <>
                      <Upload size={18} style={{ color: '#9ca3af', marginBottom: '4px' }} />
                      <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: '600', textAlign: 'center', lineHeight: 1.3 }}>Drop or<br/>click</span>
                    </>
                }
              </div>

              {/* Previews */}
              {form.images.map((img, i) => (
                <div key={i} style={{ position: 'relative', width: '76px', height: '76px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0, background: '#f9fafb' }} className="group">
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    className="group-hover:bg-black/30"
                  >
                    <button type="button"
                      onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 transition"
                      style={{ background: '#fff', color: '#ef4444', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px', border: '1px solid #fecaca', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                      Remove
                    </button>
                  </div>
                  {i === 0 && (
                    <span style={{ position: 'absolute', top: '4px', left: '4px', background: '#2563eb', color: '#fff', fontSize: '8px', fontWeight: '800', padding: '2px 5px', borderRadius: '5px' }}>
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>PNG, JPG, WEBP · Max 5 MB each · First image = main display</p>
          </div>

        </div>{/* end scrollable body */}

        {/* Footer */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 28px 24px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '13px 0', borderRadius: '14px', border: '2px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: '700', color: '#6b7280', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{
              flex: 1, padding: '13px 0', borderRadius: '14px', border: 'none',
              background: saving ? '#93c5fd' : 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              fontSize: '13px', fontWeight: '700', color: '#fff', cursor: saving ? 'default' : 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.04em',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            {saving ? 'Saving…' : (editingProduct ? 'Update Product' : 'Create Product')}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Main ProductManagement Page ──────────────────────────────────────────────
export default function ProductManagement({ products, categories, pincodes, onSave, onDelete, onToggleStatus, addToast, onNavigateToCategories }) {
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterCat, setFilterCat]         = useState('all');
  const [sortKey, setSortKey]             = useState('updatedAt');
  const [sortDir, setSortDir]             = useState('desc');
  const [page, setPage]                   = useState(1);
  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedIds, setSelectedIds]     = useState([]);
  const PER_PAGE = 10;

  const activeCategories    = categories.filter(c => c.status === 'published');
  const hasActiveCategories = activeCategories.length > 0;

  const filtered = products.filter(p => {
    const q   = search.toLowerCase();
    const ms  = !q || (p.name||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q);
    const mst = filterStatus === 'all' || p.status === filterStatus;
    const mc  = filterCat   === 'all' || p.category === filterCat;
    return ms && mst && mc;
  }).sort((a, b) => {
    let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const toggleSort = k => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('asc'); } };

  const handleSave = async (form) => {
    await onSave(form, editingProduct?.id);
    setIsFormOpen(false);
    setEditingProduct(null);
    addToast(editingProduct ? 'Product updated successfully' : 'Product added successfully', 'success');
  };

  const handleEdit      = (prod) => { setEditingProduct(prod); setIsFormOpen(true); };
  const handleDuplicate = (prod) => {
    onSave({ ...prod, id: undefined, name: prod.name + ' (Copy)', sku: 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase(), status: 'draft' }, null);
    addToast('Product duplicated as draft', 'info');
  };
  const handleDeleteConfirm = async () => {
    await onDelete(confirmDelete);
    setConfirmDelete(null);
    setSelectedIds(prev => prev.filter(id => id !== confirmDelete));
    addToast('Product deleted', 'success');
  };
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) await onDelete(id);
    setSelectedIds([]);
    addToast(`${selectedIds.length} products deleted`, 'success');
  };
  const exportCSV = () => {
    const h = ['Name','Brand','Category','MRP','Price','Stock','Status'];
    const r = filtered.map(p => [p.name, p.brand, p.category, p.mrp, p.price, p.stock, p.status]);
    const csv = [h, ...r].map(row => row.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'products.csv';
    a.click();
    addToast('Exported as CSV', 'success');
  };

  const getCatName  = id => categories.find(c => c.id === id)?.name || '—';
  const SI = ({ k }) => <ArrowUpDown size={10} className={sortKey === k ? 'text-primary' : 'text-gray-300'} />;
  const allSelected = paginated.length > 0 && selectedIds.length === paginated.length;
  const toggleAll   = () => setSelectedIds(allSelected ? [] : paginated.map(p => p.id));
  const toggleOne   = id  => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-lg font-black text-gray-900">Product Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {products.length} products · {products.filter(p => p.status === 'published').length} published
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
            <Download size={13} /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
            <Upload size={13} /> Import
          </button>
          <button
            onClick={() => {
              if (!hasActiveCategories) { addToast('Create an active category first.', 'warning', 'No Categories'); return; }
              setEditingProduct(null); setIsFormOpen(true);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${hasActiveCategories ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* No categories warning */}
      {!hasActiveCategories && (
        <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">No active categories found</p>
            <p className="text-xs text-amber-600 mt-0.5">Please create at least one active product category before adding products.</p>
            {onNavigateToCategories && (
              <button onClick={onNavigateToCategories} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-sm">
                <Plus size={12} /> Create Category
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3.5 bg-white border-b border-gray-100 flex-shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products, brands, SKU…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none bg-white text-gray-700 font-medium">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
          <option value="hidden">Hidden</option>
        </select>
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}
          className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none bg-white text-gray-700 font-medium">
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}{c.status !== 'published' ? ' (inactive)' : ''}</option>
          ))}
        </select>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">{selectedIds.length} selected</span>
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition">
              <Trash2 size={12} /> Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-xs min-w-[960px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="pl-4 pr-2 py-3 w-10">
                  <input type="checkbox" className="rounded accent-primary" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase w-14">Image</th>
                {[['name','Product'],['brand','Brand'],['category','Category']].map(([k,l]) => (
                  <th key={k} onClick={() => toggleSort(k)}
                    className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase cursor-pointer hover:text-gray-700 select-none">
                    <span className="flex items-center gap-1">{l}<SI k={k}/></span>
                  </th>
                ))}
                <th className="px-3 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Unit</th>
                <th onClick={() => toggleSort('mrp')} className="px-3 py-3 text-right text-[10px] font-black text-gray-400 uppercase cursor-pointer select-none">
                  <span className="flex items-center justify-end gap-1">MRP<SI k="mrp"/></span>
                </th>
                <th onClick={() => toggleSort('price')} className="px-3 py-3 text-right text-[10px] font-black text-gray-400 uppercase cursor-pointer select-none">
                  <span className="flex items-center justify-end gap-1">Price<SI k="price"/></span>
                </th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Disc%</th>
                <th onClick={() => toggleSort('stock')} className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase cursor-pointer select-none">
                  <span className="flex items-center justify-center gap-1">Stock<SI k="stock"/></span>
                </th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Status</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-gray-400">
                    <Package size={32} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-xs font-semibold">No products found</p>
                    {products.length === 0 && hasActiveCategories && (
                      <button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition">
                        <Plus size={12} /> Add your first product
                      </button>
                    )}
                  </td>
                </tr>
              ) : paginated.map(prod => {
                const disc       = prod.mrp > 0 && prod.price > 0 ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0;
                const isSelected = selectedIds.includes(prod.id);
                return (
                  <tr key={prod.id} className={`transition ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50/60'}`}>
                    <td className="pl-4 pr-2 py-3">
                      <input type="checkbox" className="rounded accent-primary" checked={isSelected} onChange={() => toggleOne(prod.id)} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                        <img src={getProductImage(prod.name, prod.images)} alt={prod.name}
                          className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                      </div>
                    </td>
                    <td className="px-3 py-3 max-w-[160px]">
                      <p className="font-bold text-gray-800 truncate">{prod.name}</p>
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">{prod.sku || '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{prod.brand || '—'}</td>
                    <td className="px-3 py-3 text-gray-500">{getCatName(prod.category)}</td>
                    <td className="px-3 py-3 text-gray-400">{prod.unit || prod.variants || '—'}</td>
                    <td className="px-3 py-3 text-right text-gray-500">{prod.mrp ? `₹${prod.mrp}` : '—'}</td>
                    <td className="px-3 py-3 text-right font-bold text-gray-800">{prod.price ? `₹${prod.price}` : '—'}</td>
                    <td className="px-3 py-3 text-center">
                      {disc > 0
                        ? <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">{disc}%</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center"><StockBadge stock={prod.stock} /></td>
                    <td className="px-3 py-3 text-center"><StatusBadge status={prod.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(prod)} title="Edit product"
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => onToggleStatus(prod)} title={prod.status === 'published' ? 'Unpublish' : 'Publish'}
                          className="w-7 h-7 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-600 flex items-center justify-center transition">
                          {prod.status === 'published' ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        </button>
                        <button onClick={() => handleDuplicate(prod)} title="Duplicate as draft"
                          className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 flex items-center justify-center transition">
                          <Copy size={13} />
                        </button>
                        <button onClick={() => setConfirmDelete(prod.id)} title="Delete product"
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition">
                          <Trash2 size={13} />
                        </button>
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
          <span>{filtered.length} results · Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 transition">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg border text-xs font-bold transition ${p === page ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 transition">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingProduct(null); }}
        onSave={handleSave}
        editingProduct={editingProduct}
        categories={activeCategories}
        pincodes={pincodes}
        addToast={addToast}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Product"
        message="This product will be permanently deleted and removed from the user portal. This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
        confirmLabel="Delete Product"
      />
    </div>
  );
}
