import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { productsApi, categoriesApi, pincodesApi } from '../services/api';
import { useToast } from '../components/Toast';
import ImageUploader from '../components/ImageUploader';

export default function ProductAddPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const EMPTY = { 
    name: '', brand: '', description: '', category: '', unit: '500g', mrp: '', price: '',
    stock: '', sku: '', barcode: '', expiryDate: '', status: 'published', images: [],
    featured: false, bestSeller: false, newArrival: false, trending: false, todayOffer: false,
    pincodesAvailable: [], gst: '5', lowStockAlert: '10', deliveryTime: '1-2 Days', cod: true,
    variants: '', variantList: []
  };

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, pinsRes] = await Promise.all([
          categoriesApi.getAll(),
          pincodesApi.getAll()
        ]);

        const activeCats = (cRes.data || []).filter(c => c.status === 'published');
        setCategories(activeCats);
        setPincodes(pinsRes.data || []);
        
        setForm(p => ({
          ...p,
          sku: 'UM-' + Math.random().toString(36).substring(2,8).toUpperCase(),
          category: activeCats[0]?.id || '',
          pincodesAvailable: (pinsRes.data || []).map(p => p.code || p.id || p)
        }));
      } catch (e) {
        addToast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const set = (k, v) => setForm(p => {
    const n = { ...p, [k]: v };
    if (k === 'mrp' || k === 'price') {
      const m = parseFloat(k === 'mrp' ? v : p.mrp) || 0;
      const pr = parseFloat(k === 'price' ? v : p.price) || 0;
      n.discountPercent = m > 0 && pr > 0 && m > pr ? Math.round(((m - pr) / m) * 100) : 0;
    }
    if (k === 'status') n.availabilityStatus = v;
    return n;
  });

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Product name is required', 'error'); return; }
    if (!form.category) { addToast('Category is required', 'error'); return; }
    if (!form.price) { addToast('Price is required', 'error'); return; }
    
    setSaving(true);
    try {
      const productId = 'prod_' + Math.random().toString(36).substring(2, 10);
      await productsApi.create({ ...form, id: productId });
      addToast('Product created successfully', 'success');
      navigate('/products');
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
      </div>
    );
  }

  const fi = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-white';

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/products')} className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 transition" aria-label="Go back">
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Product Catalog</span>
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">New Product</h1>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-press px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50">
          {saving ? <Loader2 size={13} className="spin" /> : <CheckCircle size={13} />}
          {saving ? 'Creating...' : 'Create Product'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Form Card 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Product Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Product name" className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Brand</label>
              <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Brand" className={fi} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Product description..." className={fi + ' resize-none'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={fi + ' cursor-pointer'}>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.emojiIcon || ''} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Unit / Size</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="e.g. 500g, 1L, Pack" className={fi} />
            </div>
          </div>
        </div>

        {/* Form Card 2: Pricing & Stock */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Pricing & Stock</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">MRP (₹)</label>
              <input type="number" min="0" value={form.mrp} onChange={e => set('mrp', e.target.value)} className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Price (₹) *</label>
              <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Stock</label>
              <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Discount %</label>
              <input value={(form.discountPercent || 0) + '%'} readOnly className={fi + ' bg-gray-50 text-center font-medium text-primary cursor-default'} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">SKU</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Barcode</label>
              <input value={form.barcode || ''} onChange={e => set('barcode', e.target.value)} className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Expiry Date</label>
              <input type="date" value={form.expiryDate || ''} onChange={e => set('expiryDate', e.target.value)} className={fi} />
            </div>
          </div>
        </div>

        {/* Form Card 2.5: Variants */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-semibold text-gray-900">Custom Variants (Multiple Units/Sizes)</h2>
            <button
              type="button"
              onClick={() => {
                const unitName = prompt('Enter custom unit/size (e.g., 1L, 500g, Pack of 6):');
                if (unitName && unitName.trim()) {
                  const priceVal = prompt('Enter price (₹) for this variant:', '0');
                  const mrpVal = prompt('Enter MRP (₹) for this variant:', priceVal || '0');
                  const stockVal = prompt('Enter stock quantity for this variant:', '100');
                  
                  const newVariant = {
                    unit: unitName.trim(),
                    price: parseFloat(priceVal) || 0,
                    mrp: parseFloat(mrpVal) || 0,
                    stock: parseInt(stockVal) || 0,
                    sku: form.sku ? `${form.sku}-${unitName.trim().toUpperCase().replace(/\s+/g, '')}` : ''
                  };
                  set('variantList', [...(form.variantList || []), newVariant]);
                }
              }}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition"
            >
              + Add Custom Variant
            </button>
          </div>

          {(form.variantList || []).length === 0 ? (
            <p className="text-xs text-gray-400 italic">No custom variants added. The product will only use the base unit and price above.</p>
          ) : (
            <div className="space-y-3">
              {(form.variantList || []).map((v, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1 min-w-[120px]">
                    <span className="text-[10px] font-semibold text-gray-400 block uppercase">Unit/Size</span>
                    <span className="text-sm font-semibold text-gray-800">{v.unit}</span>
                  </div>
                  <div className="w-24">
                    <span className="text-[10px] font-semibold text-gray-400 block uppercase">Price (₹)</span>
                    <input
                      type="number"
                      value={v.price}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const list = [...form.variantList];
                        list[i] = { ...list[i], price: val };
                        set('variantList', list);
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                    />
                  </div>
                  <div className="w-24">
                    <span className="text-[10px] font-semibold text-gray-400 block uppercase">MRP (₹)</span>
                    <input
                      type="number"
                      value={v.mrp}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const list = [...form.variantList];
                        list[i] = { ...list[i], mrp: val };
                        set('variantList', list);
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                    />
                  </div>
                  <div className="w-20">
                    <span className="text-[10px] font-semibold text-gray-400 block uppercase">Stock</span>
                    <input
                      type="number"
                      value={v.stock}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        const list = [...form.variantList];
                        list[i] = { ...list[i], stock: val };
                        set('variantList', list);
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      set('variantList', form.variantList.filter((_, j) => j !== i));
                    }}
                    className="self-end px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-semibold transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Card 3: Attributes & Availability */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Attributes & Availability</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attributes checkboxes */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
              <p className="text-xs font-semibold text-gray-800 mb-2">Promotion Attributes</p>
              {[['featured', 'Featured'], ['bestSeller', 'Best Seller'], ['newArrival', 'New Arrival'], ['trending', 'Trending'], ['todayOffer', "Today's Offer"]].map(([k, lbl]) => (
                <label key={k} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[k] || false} onChange={e => set(k, e.target.checked)} className="w-4 h-4 accent-primary rounded cursor-pointer" />
                  <span className="text-xs font-medium text-gray-700">{lbl}</span>
                </label>
              ))}
            </div>

            {/* Status and Pincodes */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={fi + ' cursor-pointer'}>
                  <option value="published">Published</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              {pincodes.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Available Pincodes</label>
                  <div className="flex flex-wrap gap-1.5 border border-gray-200 rounded-xl p-3 bg-white min-h-[44px]">
                    {pincodes.map(p => {
                      const code = p.code || p.id || p;
                      const active = form.pincodesAvailable.includes(code);
                      return (
                        <button key={code} type="button" onClick={() => set('pincodesAvailable', active ? form.pincodesAvailable.filter(x => x !== code) : [...form.pincodesAvailable, code])}
                          className={`px-2.5 py-1 rounded text-xs font-medium border transition ${active ? 'bg-primary text-white border-primary shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                          {code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Card 4: Product Images */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Product Gallery</h2>
          
          <div className="space-y-6">
            <ImageUploader
              label="Main Product Image"
              value={form.images[0] || ''}
              onChange={url => {
                if (!url) { set('images', form.images.slice(1)); return; }
                const imgs = [...form.images];
                imgs[0] = url;
                set('images', imgs);
              }}
              hint="JPG, PNG, WebP • Max 5 MB • Main display image"
            />

            {form.images.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">
                  All Gallery Images ({form.images.length})
                </label>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={img} alt="" className="w-full h-full object-cover" onError={e => e.target.src = '/logo.png'} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button type="button" onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                          className="text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition shadow-md">
                          Remove
                        </button>
                      </div>
                      {i === 0 && <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-semibold px-1 py-0.5 rounded">Main</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ImageUploader
              label="Add Additional Image"
              value=""
              onChange={url => { if (url) set('images', [...form.images, url]); }}
              hint="Add supplementary product images"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
