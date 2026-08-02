import React, { useState, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Search, X, Check, Loader2, ImageIcon,
  Grid3X3, Package, Eye, EyeOff, Copy, ChevronRight,
  TrendingUp, AlertCircle, Star, ArrowUpDown, Filter, MoreVertical, Sprout
} from 'lucide-react';
import { db } from '../../db/mockFirebase';
import { ConfirmDialog } from './ConfirmDialog';

// ─── Design tokens ────────────────────────────────────────────────────────────
const inp = [
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800',
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
  'transition placeholder:text-gray-400 bg-white'
].join(' ');

// ─── HD category image map ────────────────────────────────────────────────────
const CAT_IMAGES = {
  'grocery':    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
  'fruits':     'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80',
  'dairy':      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
  'bakery':     'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
  'snacks':     'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
  'beverages':  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
  'seeds':      'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&q=80',
  'dry fruits': 'https://images.unsplash.com/photo-1598449426314-8b02525e8733?w=400&q=80',
  'spices':     'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
  'oils':       'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
  'chocolates': 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80',
  'instant':    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',
  'baby':       'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80',
  'personal':   'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
  'home':       'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&q=80',
  'cleaning':   'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
  'pet':        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80',
  'frozen':     'https://images.unsplash.com/photo-1563281577-a7be47e20aa9?w=400&q=80',
  'meat':       'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  'health':     'https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&q=80',
  'seasonal':   'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80',
};

const getCatImage = (name = '', icon = '') => {
  if (icon && !icon.startsWith('data:')) return icon;
  if (icon && icon.startsWith('data:')) return icon;
  const n = name.toLowerCase();
  for (const [key, url] of Object.entries(CAT_IMAGES)) {
    if (n.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
};

// ─── Default category suggestions ────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { emoji: '🌾', name: 'Grocery & Staples',     description: 'Rice, dal, atta and everyday staples.' },
  { emoji: '🥬', name: 'Fruits & Vegetables',   description: 'Fresh fruits and farm vegetables.' },
  { emoji: '🥛', name: 'Dairy & Eggs',          description: 'Milk, curd, cheese, butter and eggs.' },
  { emoji: '🍞', name: 'Bakery',                description: 'Bread, buns, cakes and baked goods.' },
  { emoji: '🍪', name: 'Snacks',                description: 'Chips, biscuits, namkeen and more.' },
  { emoji: '🥤', name: 'Juices & Beverages',    description: 'Juices, soft drinks and energy drinks.' },
  { emoji: '🌱', name: 'Edible Seeds',          description: 'Flax, chia, sunflower and pumpkin seeds.' },
  { emoji: '🥜', name: 'Dry Fruits & Nuts',     description: 'Almonds, cashews, raisins and walnuts.' },
  { emoji: '🧂', name: 'Spices & Masalas',      description: 'Whole spices, blended masalas and herbs.' },
  { emoji: '🛢',  name: 'Cooking Oils & Ghee',  description: 'Refined oils, mustard oil and pure ghee.' },
  { emoji: '🍫', name: 'Chocolates & Sweets',   description: 'Chocolates, candies and mithai.' },
  { emoji: '🍜', name: 'Instant Foods',         description: 'Noodles, pasta, ready meals and soups.' },
  { emoji: '🍼', name: 'Baby Care',             description: 'Baby food, diapers and care essentials.' },
  { emoji: '🧴', name: 'Personal Care',         description: 'Shampoo, soap, skincare and grooming.' },
  { emoji: '🏠', name: 'Home & Kitchen',        description: 'Utensils, containers and kitchen tools.' },
  { emoji: '🧹', name: 'Cleaning Essentials',   description: 'Detergent, floor cleaners and scrubs.' },
  { emoji: '🐶', name: 'Pet Care',              description: 'Pet food, treats and accessories.' },
  { emoji: '❄',  name: 'Frozen Foods',          description: 'Ice cream, frozen veggies and meals.' },
  { emoji: '🥩', name: 'Meat & Seafood',        description: 'Fresh chicken, fish and mutton.' },
  { emoji: '💊', name: 'Health & Wellness',     description: 'Vitamins, protein and health supplements.' },
  { emoji: '🎁', name: 'Seasonal Offers',       description: 'Festival and seasonal special collections.' },
];

// ─── Image picker ─────────────────────────────────────────────────────────────
function ImagePicker({ label, value, onChange, hint }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const pick = async (files) => {
    if (!files?.length) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) return;
    setBusy(true);
    const url = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result);
      r.onerror   = rej;
      r.readAsDataURL(f);
    });
    setBusy(false);
    onChange(url);
  };

  return (
    <div>
      {label && <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>}
      <div
        onClick={() => ref.current?.click()}
        className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer overflow-hidden transition-all hover:border-emerald-400 hover:bg-emerald-50/30 group"
        style={{ height: value ? '120px' : '90px' }}
      >
        {busy ? (
          <Loader2 size={22} className="text-emerald-500 animate-spin" />
        ) : value ? (
          <>
            <img src={value} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <p className="text-white text-xs font-bold">Click to change</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 py-4 text-gray-400">
            <ImageIcon size={22} />
            <p className="text-xs font-medium">Click to upload</p>
            {hint && <p className="text-[10px] text-gray-300">{hint}</p>}
          </div>
        )}
      </div>
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-[11px] text-red-400 hover:text-red-600 mt-1 font-medium">
          Remove image
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { pick(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

// ─── Category Modal (Add / Edit) ─────────────────────────────────────────────
function CategoryModal({ initial, onSave, onClose, existingNames }) {
  const [name,        setName]        = useState(initial?.name        || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [icon,        setIcon]        = useState(initial?.icon        || '');
  const [banner,      setBanner]      = useState(initial?.banner      || '');
  const [emojiIcon,   setEmojiIcon]   = useState(initial?.emojiIcon   || '');
  const [status,      setStatus]      = useState(initial?.status      || 'published');
  const [featured,    setFeatured]    = useState(initial?.featured    ?? false);
  const [order,       setOrder]       = useState(initial?.displayOrder ?? 0);
  const [err,         setErr]         = useState('');
  const [saving,      setSaving]      = useState(false);
  const [tab,         setTab]         = useState('basic'); // basic | images

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setErr('Category name is required.'); return; }
    const dupe = existingNames.find(n => n.toLowerCase() === trimmed.toLowerCase() && n !== initial?.name);
    if (dupe) { setErr('A category with this name already exists.'); return; }
    setErr('');
    setSaving(true);
    try {
      await onSave({ name: trimmed, description: description.trim(), icon, banner, emojiIcon, status, featured, displayOrder: Number(order) });
      onClose();
    } catch (e) {
      console.error('[CategoryModal] save error:', e);
      setErr(e?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-pop" style={{ maxHeight: '92vh' }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-gray-900">{initial ? 'Edit Category' : 'Create New Category'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{initial ? 'Update category details' : 'Add a new grocery category to your store'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 flex-shrink-0 px-6">
          {[['basic', 'Basic Info'], ['images', 'Images & Media']].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`py-3 px-1 mr-6 text-xs font-bold border-b-2 transition ${tab === id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Modal body */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {tab === 'basic' && (
              <>
                {/* Category Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Category Name <span className="text-red-400">*</span></label>
                  <input value={name} onChange={e => { setName(e.target.value); setErr(''); }}
                    placeholder="e.g. Fruits & Vegetables" className={inp} />
                  {err && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11}/>{err}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Short Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={2} placeholder="Brief description of this category…"
                    className={inp + ' resize-none'} />
                </div>

                {/* Emoji icon */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Category Emoji / Icon</label>
                  <input value={emojiIcon} onChange={e => setEmojiIcon(e.target.value)}
                    placeholder="e.g. 🥬 or 🛒" className={inp} maxLength={4} />
                  <p className="text-[11px] text-gray-400 mt-1">Used as a quick visual identifier on category chips.</p>
                </div>

                {/* Status + Featured row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className={inp + ' cursor-pointer'}>
                      <option value="published">✅ Active</option>
                      <option value="inactive">🚫 Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Display Order</label>
                    <input type="number" min="0" value={order} onChange={e => setOrder(e.target.value)} className={inp} />
                  </div>
                </div>

                {/* Featured toggle */}
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5"><Star size={14} className="text-amber-500" /> Featured Category</p>
                    <p className="text-xs text-amber-600 mt-0.5">Show this category prominently on the homepage.</p>
                  </div>
                  <button type="button" onClick={() => setFeatured(v => !v)}
                    className={`relative w-11 h-6 rounded-full transition-all ${featured ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${featured ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </>
            )}

            {tab === 'images' && (
              <>
                <ImagePicker label="Category Image (card thumbnail)" value={icon} onChange={setIcon} hint="Recommended: 400×400px" />
                <ImagePicker label="Category Banner Image (optional)" value={banner} onChange={setBanner} hint="Recommended: 1200×400px wide banner" />

                {/* Suggestion: pick from default library */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Or use a stock image from library</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(CAT_IMAGES).slice(0, 8).map(([key, url]) => (
                      <button key={key} type="button" onClick={() => setIcon(url)}
                        className={`rounded-xl overflow-hidden border-2 transition ${icon === url ? 'border-emerald-500' : 'border-transparent hover:border-emerald-300'}`}>
                        <img src={url} alt={key} className="w-full h-12 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex items-center gap-3 px-6 pb-6">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0B6F3A 0%, #14a857 100%)', boxShadow: '0 4px 14px rgba(11,111,58,0.35)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Saving…' : (initial ? 'Save Changes' : 'Create Category')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, textColor, subLabel }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative p-5 flex items-center gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: gradient }}>
        <Icon size={22} className="text-white" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black leading-none" style={{ color: textColor || '#1a1a1a' }}>{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
        {subLabel && <p className="text-[10px] text-gray-400 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  );
}

// ─── Main CategoryManagement Component ───────────────────────────────────────
export default function CategoryManagement({ categories, products, addToast, onNavigateToProducts }) {
  const [search,       setSearch]       = useState('');
  const [filterTab,    setFilterTab]    = useState('all'); // all | active | inactive | featured | newest
  const [showModal,    setShowModal]    = useState(false);
  const [editingCat,   setEditingCat]   = useState(null);
  const [confirmDel,   setConfirmDel]   = useState(null);
  const [menuOpen,     setMenuOpen]     = useState(null);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeCount   = categories.filter(c => c.status === 'published').length;
  const inactiveCount = categories.filter(c => c.status !== 'published').length;

  // Count products per category
  const productsByCategory = (catId) => products.filter(p => p.category === catId).length;
  const totalProductsInCategories = categories.reduce((sum, c) => sum + productsByCategory(c.id), 0);

  // ── Filter categories ─────────────────────────────────────────────────────
  let visible = [...categories];
  if (search) visible = visible.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  if (filterTab === 'active')   visible = visible.filter(c => c.status === 'published');
  if (filterTab === 'inactive') visible = visible.filter(c => c.status !== 'published');
  if (filterTab === 'featured') visible = visible.filter(c => c.featured);
  if (filterTab === 'newest')   visible = visible.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 10);
  else visible = visible.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    const id = 'cat_' + Math.random().toString(36).substring(2, 9);
    const payload = { id, ...data, createdAt: Date.now(), updatedAt: Date.now() };
    console.log('[CategoryManagement] CREATE — id:', id, 'payload:', payload);
    try {
      const result = await db.collection('categories').set(id, payload);
      console.log('[CategoryManagement] CREATE success — response:', result);
      addToast(`Category "${data.name}" created successfully`, 'success');
      setShowModal(false);
      setEditingCat(null);
    } catch (e) {
      console.error('[CategoryManagement] CREATE failed:', e);
      addToast('Failed to create category: ' + (e?.message || String(e)), 'error');
      throw e; // re-throw so modal stays open
    }
  };

  const handleUpdate = async (data) => {
    if (!editingCat) return;
    const id = editingCat.id;
    const payload = { ...data, updatedAt: Date.now() };
    console.log('[CategoryManagement] UPDATE — id:', id, 'payload:', payload);
    try {
      const result = await db.collection('categories').update(id, payload);
      console.log('[CategoryManagement] UPDATE success — response:', result);
      addToast(`Category "${data.name}" saved successfully`, 'success');
      setShowModal(false);
      setEditingCat(null);
    } catch (e) {
      console.error('[CategoryManagement] UPDATE failed:', e);
      addToast('Failed to save category: ' + (e?.message || String(e)), 'error');
      throw e; // re-throw so modal stays open
    }
  };

  const handleDelete = async () => {
    const id = confirmDel;
    setConfirmDel(null);
    try {
      await db.collection('categories').delete(id);
      addToast('Category deleted', 'success');
    } catch (e) {
      addToast('Failed to delete: ' + e.message, 'error');
    }
  };

  const handleToggleStatus = async (cat) => {
    const next = cat.status === 'published' ? 'inactive' : 'published';
    await db.collection('categories').update(cat.id, { status: next, updatedAt: Date.now() });
    addToast(`Category ${next === 'published' ? 'activated' : 'deactivated'}`, 'info');
  };

  const handleDuplicate = async (cat) => {
    const id = 'cat_' + Math.random().toString(36).substring(2, 9);
    const copy = { ...cat, id, name: cat.name + ' (Copy)', createdAt: Date.now(), updatedAt: Date.now() };
    delete copy.featured;
    await db.collection('categories').set(id, copy);
    addToast(`Category duplicated as "${copy.name}"`, 'success');
  };

  const existingNames = categories.map(c => c.name);

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">Category Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage all grocery categories for the UshaMart application.</p>
          </div>
          <button onClick={() => { setShowModal(true); setEditingCat(null); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0B6F3A 0%, #14a857 100%)' }}>
            <Plus size={16} strokeWidth={2.5} /> Add Category
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Stats Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Categories" value={categories.length} icon={Grid3X3}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
          <StatCard label="Active Categories" value={activeCount} icon={Check}
            gradient="linear-gradient(135deg, #0B6F3A 0%, #14a857 100%)" />
          <StatCard label="Inactive Categories" value={inactiveCount} icon={X}
            gradient="linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)" />
          <StatCard label="Total Products" value={totalProductsInCategories} icon={Package}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
        </div>

        {/* ── Search & Filter Row ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3" style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search categories by name…"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50 transition" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Sort button */}
            <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              <ArrowUpDown size={14} /> Sort
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 mr-1 flex items-center gap-1"><Filter size={12}/>Filter:</span>
            {[
              { id: 'all',      label: 'All',      count: categories.length },
              { id: 'active',   label: 'Active',   count: activeCount },
              { id: 'inactive', label: 'Inactive', count: inactiveCount },
              { id: 'featured', label: 'Featured', count: categories.filter(c => c.featured).length },
              { id: 'newest',   label: 'Newest 10', count: null },
            ].map(f => (
              <button key={f.id} onClick={() => setFilterTab(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${filterTab === f.id
                  ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={filterTab === f.id ? { background:'linear-gradient(135deg,#0B6F3A,#14a857)' } : {}}>
                {f.label}
                {f.count !== null && <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${filterTab === f.id ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500'}`}>{f.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty State ───────────────────────────────────────────────────── */}
        {categories.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 px-8 text-center"
            style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
              style={{ background:'linear-gradient(135deg,#E8F5E9 0%,#C8E6C9 100%)' }}>
              <Grid3X3 size={40} className="text-emerald-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">No Categories Found</h3>
            <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
              Create your first grocery category to start organizing products for your customers.
            </p>
            <button onClick={() => { setShowModal(true); setEditingCat(null); }}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition"
              style={{ background:'linear-gradient(135deg,#0B6F3A 0%,#14a857 100%)', boxShadow:'0 6px 20px rgba(11,111,58,0.35)' }}>
              <Plus size={16} /> Create Category
            </button>

            {/* Suggested defaults */}
            <div className="mt-10 w-full">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Or start with a popular category</p>
              <div className="grid grid-cols-3 gap-3">
                {DEFAULT_CATEGORIES.slice(0, 7).map(dc => {
                  const isEdibleSeeds = dc.name === 'Edible Seeds';
                  return (
                    <button
                      key={dc.name}
                      onClick={async () => {
                        const id = 'cat_' + Math.random().toString(36).substring(2, 9);
                        await db.collection('categories').set(id, {
                          id,
                          name: dc.name,
                          description: dc.description,
                          emojiIcon: dc.emoji,
                          icon: getCatImage(dc.name, ''),
                          status: 'published',
                          featured: false,
                          displayOrder: 0,
                          createdAt: Date.now(),
                          updatedAt: Date.now()
                        });
                        addToast(`"${dc.name}" created`, 'success');
                      }}
                      className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/30 transition text-center group"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(11,111,58,0.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
                    >
                      {isEdibleSeeds ? (
                        /* Premium seedling icon for Edible Seeds */
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                          style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', boxShadow: '0 2px 8px rgba(11,111,58,0.20)' }}
                        >
                          <Sprout size={20} className="text-emerald-600" strokeWidth={2} />
                        </div>
                      ) : (
                        <span className="text-2xl group-hover:scale-110 transition-transform inline-block">{dc.emoji}</span>
                      )}
                      <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-700 leading-tight">{dc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── No search results ─────────────────────────────────────────────── */}
        {categories.length > 0 && visible.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center shadow-sm">
            <Search size={32} className="mx-auto mb-3 text-gray-200" />
            <h3 className="text-sm font-bold text-gray-600">No results for "{search}"</h3>
            <p className="text-xs text-gray-400 mt-1">Try a different search term or adjust the filter.</p>
          </div>
        )}

        {/* ── Category Cards Grid ───────────────────────────────────────────── */}
        {visible.length > 0 && (
          <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
            {visible.map((cat) => {
              const prodCount = productsByCategory(cat.id);
              const img       = getCatImage(cat.name, cat.icon);
              const isActive  = cat.status === 'published';
              const isMenuOpen = menuOpen === cat.id;

              return (
                <div key={cat.id}
                  className={`bg-white rounded-3xl border overflow-hidden transition-all group cursor-default ${isActive ? 'border-gray-100 hover:border-emerald-200' : 'border-gray-200 opacity-75 hover:opacity-100'}`}
                  style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)', transition:'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                  {/* Category image */}
                  <div className="relative overflow-hidden" style={{ height:'130px' }}>
                    <img src={img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'; }} />
                    <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)' }} />

                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black backdrop-blur-md border ${isActive ? 'bg-emerald-500/90 text-white border-emerald-400/50' : 'bg-gray-600/80 text-white border-gray-500/50'}`}>
                        {isActive ? '✅ Active' : '🚫 Inactive'}
                      </span>
                    </div>

                    {/* Featured badge */}
                    {cat.featured && (
                      <div className="absolute top-3 right-12">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-400/90 text-amber-900 border border-amber-300/50 backdrop-blur-md flex items-center gap-1">
                          <Star size={9} fill="currentColor" /> Featured
                        </span>
                      </div>
                    )}

                    {/* Emoji overlay */}
                    {cat.emojiIcon && (
                      <div className="absolute bottom-3 left-3 text-2xl leading-none drop-shadow-lg">{cat.emojiIcon}</div>
                    )}

                    {/* 3-dot menu button */}
                    <div className="absolute top-3 right-3">
                      <button onClick={() => setMenuOpen(isMenuOpen ? null : cat.id)}
                        className="w-7 h-7 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:bg-white transition border border-white/50">
                        <MoreVertical size={13} className="text-gray-700" />
                      </button>

                      {/* Dropdown menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-9 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-pop"
                          onMouseLeave={() => setMenuOpen(null)}>
                          {[
                            { icon: Edit2,   label: 'Edit',          action: () => { setEditingCat(cat); setShowModal(true); setMenuOpen(null); }, color: 'text-blue-600' },
                            { icon: isActive ? EyeOff : Eye, label: isActive ? 'Deactivate' : 'Activate', action: () => { handleToggleStatus(cat); setMenuOpen(null); }, color: 'text-amber-600' },
                            { icon: Copy,    label: 'Duplicate',     action: () => { handleDuplicate(cat); setMenuOpen(null); }, color: 'text-purple-600' },
                            { icon: Package, label: 'View Products', action: () => { if (onNavigateToProducts) onNavigateToProducts(cat.id); setMenuOpen(null); }, color: 'text-emerald-600' },
                            { icon: Trash2,  label: 'Delete',        action: () => { setConfirmDel(cat.id); setMenuOpen(null); }, color: 'text-red-500', danger: true },
                          ].map((item, i) => (
                            <React.Fragment key={item.label}>
                              {i === 4 && <div className="h-px bg-gray-100 mx-2" />}
                              <button onClick={item.action}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition hover:bg-gray-50 ${item.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700'}`}>
                                <item.icon size={13} className={item.color} />
                                {item.label}
                              </button>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <h3 className="text-sm font-black text-gray-900 leading-tight truncate">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{cat.description}</p>
                    )}

                    {/* Metadata row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background:'linear-gradient(135deg,#E8F5E9,#C8E6C9)' }}>
                          <Package size={12} className="text-emerald-700" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{prodCount} Products</span>
                      </div>
                      {cat.createdAt && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(cat.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                        </span>
                      )}
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setEditingCat(cat); setShowModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-blue-200 text-xs font-bold text-blue-600 hover:bg-blue-50 transition">
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => handleToggleStatus(cat)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition ${isActive ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                        {isActive ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Show</>}
                      </button>
                      <button onClick={() => setConfirmDel(cat.id)}
                        className="w-9 flex items-center justify-center py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Default category quick-add strip (only when few categories) ─── */}
        {categories.length > 0 && categories.length < 5 && (
          <div className="bg-white rounded-3xl border border-dashed border-emerald-200 p-5 shadow-sm"
            style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-800">Add More Categories</h3>
                <p className="text-xs text-gray-500 mt-0.5">Quickly add popular grocery categories with one click.</p>
              </div>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES
                .filter(dc => !categories.find(c => c.name.toLowerCase() === dc.name.toLowerCase()))
                .slice(0, 12)
                .map(dc => (
                  <button key={dc.name}
                    onClick={async () => {
                      const id = 'cat_' + Math.random().toString(36).substring(2, 9);
                      await db.collection('categories').set(id, { id, name: dc.name, description: dc.description, emojiIcon: dc.emoji, icon: getCatImage(dc.name, ''), status: 'published', featured: false, displayOrder: 0, createdAt: Date.now(), updatedAt: Date.now() });
                      addToast(`"${dc.name}" added`, 'success');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-xl text-xs font-semibold text-gray-700 hover:text-emerald-700 transition">
                    <span>{dc.emoji}</span> {dc.name}
                  </button>
                ))}
            </div>
          </div>
        )}

      </div>{/* end scrollable area */}

      {/* ── Category Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <CategoryModal
          initial={editingCat}
          onSave={editingCat ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditingCat(null); }}
          existingNames={existingNames}
        />
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!confirmDel}
        title="Delete Category"
        message="Products in this category will lose their category assignment. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
        confirmLabel="Delete Category"
      />
    </div>
  );
}
