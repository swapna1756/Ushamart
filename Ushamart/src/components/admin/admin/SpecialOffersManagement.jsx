import React, { useState, useRef } from 'react';
import {
  Plus, Edit2, Trash2, X, Check, Loader2, ImageIcon,
  Gift, Calendar, Eye, EyeOff, AlertCircle, Package,
  Grid3X3, ArrowUp, ArrowDown, Clock, Layers
} from 'lucide-react';
import { db } from '../../db/mockFirebase';
import { ConfirmDialog } from './ConfirmDialog';

const inp = [
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800',
  'focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500',
  'transition placeholder:text-gray-400 bg-white'
].join(' ');

const OFFER_TYPES = [
  { value: 'category',  label: '📂 Category Offer',     desc: 'Link to a single category' },
  { value: 'product',   label: '📦 Product Offer',       desc: 'Link to a single product' },
  { value: 'multi',     label: '🛒 Multiple Products',   desc: 'Select multiple products' },
  { value: 'general',   label: '🎉 General Promotion',   desc: 'No specific link' },
];

const STATUS_OPTS = [
  { value: 'active',    label: '✅ Active' },
  { value: 'inactive',  label: '🚫 Inactive' },
  { value: 'scheduled', label: '📅 Scheduled' },
];

function StatCard({ label, value, icon, gradient }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div>
        <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Image Picker ──────────────────────────────────────────────────────────────
// Converts the selected image to a persistent base64 data URL immediately.
// Falls back to FileReader-based base64 (same approach as Products & Categories).
// Does NOT depend on Firebase Storage — works 100% offline.
function ImagePicker({ label, value, onChange, hint }) {
  const [busy,     setBusy]     = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef(null);

  const readAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Could not read the image file.'));
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected if needed
    e.target.value = '';
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setImgError(true);
      return;
    }

    setImgError(false);
    setBusy(true);

    try {
      // 1. Show instant blob preview while converting
      const blobUrl = URL.createObjectURL(file);
      onChange(blobUrl); // immediate preview — replaced below with persistent URL

      // 2. Convert to base64 — this is the PERSISTENT storage (same as Products/Categories)
      const base64 = await readAsBase64(file);

      // 3. Replace the temporary blob URL with the permanent base64 data URL
      URL.revokeObjectURL(blobUrl);
      onChange(base64);
    } catch (err) {
      console.error('[ImagePicker] upload failed:', err);
      setImgError(true);
      onChange(''); // clear invalid state
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {label && <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>}

      {/* Click zone */}
      <div
        onClick={() => !busy && fileRef.current?.click()}
        className="relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl overflow-hidden transition-all group"
        style={{
          height:       value ? '140px' : '88px',
          borderColor:  busy ? '#7c3aed' : (imgError ? '#ef4444' : '#e5e7eb'),
          background:   value ? 'transparent' : '#fafafe',
          cursor:       busy ? 'wait' : 'pointer',
        }}
        role="button"
        aria-label="Upload banner image"
      >
        {/* Busy spinner overlay — only shown while converting */}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <Loader2 size={24} className="text-violet-500 animate-spin mb-1" />
            <p className="text-[11px] text-violet-600 font-semibold">Processing image…</p>
          </div>
        )}

        {/* Preview */}
        {!busy && value ? (
          <>
            <img
              src={value}
              alt="Banner preview"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none">
              <ImageIcon size={20} className="text-white" />
              <p className="text-white text-xs font-bold">Click to change</p>
            </div>
          </>
        ) : !busy && !value ? (
          <div className="flex flex-col items-center gap-1.5 py-4 text-gray-400 pointer-events-none">
            <ImageIcon size={24} />
            <p className="text-xs font-semibold text-gray-500">Click to upload banner image</p>
            {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
          </div>
        ) : null}
      </div>

      {/* Error message */}
      {imgError && (
        <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
          <AlertCircle size={12} /> Unable to load image. Please try a different file.
        </p>
      )}

      {/* Remove button */}
      {value && !busy && (
        <button
          type="button"
          onClick={() => { onChange(''); setImgError(false); }}
          className="text-[11px] text-red-400 hover:text-red-600 mt-1.5 font-semibold transition"
        >
          ✕ Remove image
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── Offer Modal ───────────────────────────────────────────────────────────────
function OfferModal({ initial, categories, products, onSave, onClose }) {
  const [title,        setTitle]        = useState(initial?.title       || '');
  const [subtitle,     setSubtitle]     = useState(initial?.subtitle    || '');
  const [badgeText,    setBadgeText]    = useState(initial?.badgeText   || '');
  const [buttonText,   setButtonText]   = useState(initial?.buttonText  || 'SHOP NOW →');
  const [imageUrl,     setImageUrl]     = useState(initial?.imageUrl    || '');
  const [offerType,    setOfferType]    = useState(initial?.offerType   || 'category');
  const [linkedCatId,  setLinkedCatId]  = useState(initial?.linkedCatId || '');
  const [linkedProdId, setLinkedProdId] = useState(initial?.linkedProdId|| '');
  const [multiProdIds, setMultiProdIds] = useState(initial?.multiProdIds|| []);
  const [startDate,    setStartDate]    = useState(initial?.startDate   || '');
  const [endDate,      setEndDate]      = useState(initial?.endDate     || '');
  const [status,       setStatus]       = useState(initial?.status      || 'active');
  const [displayOrder, setDisplayOrder] = useState(initial?.displayOrder|| 0);
  const [bgColor,      setBgColor]      = useState(initial?.bgColor     || '#ede9fe');
  const [err,          setErr]          = useState('');
  const [saving,       setSaving]       = useState(false);

  const toggleMultiProd = (id) => {
    setMultiProdIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setErr('Offer title is required.'); return; }
    if (!imageUrl)      { setErr('Please upload a banner image.'); return; }
    if (offerType === 'category' && !linkedCatId)  { setErr('Please select a category.'); return; }
    if (offerType === 'product'  && !linkedProdId) { setErr('Please select a product.'); return; }
    if (offerType === 'multi'    && multiProdIds.length === 0) { setErr('Select at least one product.'); return; }
    setErr(''); setSaving(true);
    try {
      await onSave({
        title: title.trim(), subtitle: subtitle.trim(), badgeText: badgeText.trim(),
        buttonText: buttonText.trim() || 'SHOP NOW →', imageUrl,
        offerType, linkedCatId, linkedProdId, multiProdIds,
        startDate, endDate, status, displayOrder: Number(displayOrder), bgColor,
        active: status === 'active',
      });
    } catch (e) {
      setErr(e?.message || 'Save failed. Please try again.');
    } finally { setSaving(false); }
  };

  const pubCats   = categories.filter(c => c.status === 'published');
  const pubProds  = products.filter(p => p.status === 'published');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-gray-900">
              {initial ? 'Edit Special Offer' : 'Create Special Offer'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Design a promotional banner for the user home page</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {/* Banner Image */}
            <ImagePicker
              label="Banner Image *"
              value={imageUrl}
              onChange={setImageUrl}
              hint="Recommended: 800×400px. Product/grocery photo works best."
            />

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Offer Title <span className="text-red-400">*</span>
              </label>
              <input value={title} onChange={e => { setTitle(e.target.value); setErr(''); }}
                placeholder="e.g. Healthy Snack Week" className={inp} />
            </div>

            {/* Subtitle */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Subtitle</label>
              <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
                placeholder="e.g. Good choices. Better everyday moments." className={inp} />
            </div>

            {/* Badge + Button row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Discount Badge</label>
                <input value={badgeText} onChange={e => setBadgeText(e.target.value)}
                  placeholder="e.g. UP TO 30% OFF" className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">CTA Button Text</label>
                <input value={buttonText} onChange={e => setButtonText(e.target.value)}
                  placeholder="SHOP NOW →" className={inp} />
              </div>
            </div>

            {/* BG Color */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Banner Background Color</label>
              <div className="flex items-center gap-3 flex-wrap">
                {['#ede9fe','#dcfce7','#fef3c7','#fce7f3','#dbeafe','#ffedd5','#f0fdf4','#fdf4ff'].map(c => (
                  <button key={c} type="button" onClick={() => setBgColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition"
                    style={{ background: c, borderColor: bgColor === c ? '#7c3aed' : 'transparent',
                      boxShadow: bgColor === c ? '0 0 0 2px #7c3aed' : 'none' }} />
                ))}
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer border border-gray-200"
                  title="Custom color" />
              </div>
            </div>

            {/* Offer Type */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">
                Offer Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OFFER_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => { setOfferType(t.value); setErr(''); }}
                    className="text-left p-3 rounded-xl border-2 transition"
                    style={{ borderColor: offerType === t.value ? '#7c3aed' : '#e5e7eb',
                      background: offerType === t.value ? '#f5f3ff' : '#fff' }}>
                    <p className="text-xs font-bold text-gray-800">{t.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Category picker */}
            {offerType === 'category' && (
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Link to Category <span className="text-red-400">*</span>
                </label>
                <select value={linkedCatId} onChange={e => { setLinkedCatId(e.target.value); setErr(''); }}
                  className={inp + ' cursor-pointer'}>
                  <option value="">— Select Category —</option>
                  {pubCats.map(c => (
                    <option key={c.id} value={c.id}>{c.emojiIcon ? `${c.emojiIcon} ` : ''}{c.name}</option>
                  ))}
                </select>
                {pubCats.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1.5">
                    No active categories found. Create categories first.
                  </p>
                )}
              </div>
            )}

            {/* Single product picker */}
            {offerType === 'product' && (
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Link to Product <span className="text-red-400">*</span>
                </label>
                <select value={linkedProdId} onChange={e => { setLinkedProdId(e.target.value); setErr(''); }}
                  className={inp + ' cursor-pointer'}>
                  <option value="">— Select Product —</option>
                  {pubProds.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Multi product picker */}
            {offerType === 'multi' && (
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  Select Products <span className="text-red-400">*</span>
                  <span className="text-[10px] text-gray-400 ml-1 font-normal">
                    ({multiProdIds.length} selected)
                  </span>
                </label>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                  {pubProds.length === 0 ? (
                    <p className="text-xs text-gray-400 p-4 text-center">No published products found.</p>
                  ) : pubProds.map(p => (
                    <label key={p.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-violet-50/40 cursor-pointer border-b border-gray-100 last:border-0">
                      <input type="checkbox" checked={multiProdIds.includes(p.id)}
                        onChange={() => { toggleMultiProd(p.id); setErr(''); }}
                        className="w-4 h-4 accent-violet-600 rounded" />
                      <span className="text-xs font-semibold text-gray-700 flex-1 truncate">{p.name}</span>
                      {p.price && <span className="text-[10px] text-gray-400 flex-shrink-0">₹{p.price}</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className={inp} />
              </div>
            </div>

            {/* Status + Order */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className={inp + ' cursor-pointer'}>
                  {STATUS_OPTS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Display Order</label>
                <input type="number" min="0" value={displayOrder}
                  onChange={e => setDisplayOrder(e.target.value)} className={inp} />
              </div>
            </div>

            {err && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-600">{err}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-6 pb-6">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#9d5cf6)',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Saving…' : (initial ? 'Save Changes' : 'Create Special Offer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function SpecialOffersManagement({ specialOffers, categories, products, addToast }) {
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const now = Date.now();
  const isOfferActive = (o) => {
    if (o.status !== 'active') return false;
    if (o.endDate && new Date(o.endDate).getTime() < now) return false;
    if (o.startDate && new Date(o.startDate).getTime() > now) return false;
    return true;
  };

  const totalOffers     = specialOffers.length;
  const activeOffers    = specialOffers.filter(isOfferActive).length;
  const scheduledOffers = specialOffers.filter(o =>
    o.status === 'scheduled' || (o.startDate && new Date(o.startDate).getTime() > now)
  ).length;
  const expiredOffers   = specialOffers.filter(o =>
    o.endDate && new Date(o.endDate).getTime() < now
  ).length;

  const sorted = [...specialOffers].sort((a, b) =>
    (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
  );

  const getCatName   = (id) => categories.find(c => c.id === id)?.name || '—';
  const getProdName  = (id) => products.find(p => p.id === id)?.name   || '—';

  const handleCreate = async (data) => {
    const id = 'offer_' + Math.random().toString(36).substring(2, 9);
    await db.collection('special_offers').set(id, { id, ...data, createdAt: Date.now(), updatedAt: Date.now() });
    addToast(`Offer "${data.title}" created!`, 'success');
    setShowModal(false);
  };

  const handleUpdate = async (data) => {
    await db.collection('special_offers').update(editing.id, { ...data, updatedAt: Date.now() });
    addToast(`Offer "${data.title}" updated.`, 'success');
    setShowModal(false); setEditing(null);
  };

  const handleDelete = async () => {
    const id = confirmDel;
    setConfirmDel(null);
    await db.collection('special_offers').delete(id);
    addToast('Offer deleted.', 'info');
  };

  const moveOrder = async (offer, dir) => {
    const newOrder = (offer.displayOrder ?? 0) + dir;
    await db.collection('special_offers').update(offer.id, { displayOrder: newOrder, updatedAt: Date.now() });
  };

  const toggleStatus = async (offer) => {
    const next = offer.status === 'active' ? 'inactive' : 'active';
    await db.collection('special_offers').update(offer.id,
      { status: next, active: next === 'active', updatedAt: Date.now() }
    );
    addToast(`Offer ${next === 'active' ? 'activated' : 'deactivated'}.`, 'info');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Gift size={20} className="text-violet-600" /> Special Offers Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Control the promotional carousel shown on the user home page.
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#9d5cf6)' }}>
            <Plus size={16} strokeWidth={2.5} /> Add Special Offer
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Offers"     value={totalOffers}     icon="🎁" gradient="linear-gradient(135deg,#7c3aed,#9d5cf6)" />
          <StatCard label="Active Offers"    value={activeOffers}    icon="✅" gradient="linear-gradient(135deg,#16a34a,#22c55e)" />
          <StatCard label="Scheduled"        value={scheduledOffers} icon="📅" gradient="linear-gradient(135deg,#d97706,#f59e0b)" />
          <StatCard label="Expired"          value={expiredOffers}   icon="⏰" gradient="linear-gradient(135deg,#6b7280,#9ca3af)" />
        </div>

        {/* Empty state */}
        {totalOffers === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center py-20 px-8 text-center"
            style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
              <Gift size={36} className="text-violet-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">No Special Offers Yet</h3>
            <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
              Create your first promotional offer to display a stunning banner carousel on the user home page.
            </p>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold text-white shadow-lg"
              style={{ background:'linear-gradient(135deg,#7c3aed,#9d5cf6)', boxShadow:'0 6px 20px rgba(124,58,237,0.35)' }}>
              <Plus size={16} /> Create First Offer
            </button>
          </div>
        )}

        {/* Offer Cards */}
        {sorted.length > 0 && (
          <div className="space-y-4">
            {sorted.map((offer, idx) => {
              const active = isOfferActive(offer);
              const expired = offer.endDate && new Date(offer.endDate).getTime() < now;
              return (
                <div key={offer.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex gap-0"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

                  {/* Color stripe */}
                  <div className="w-1.5 flex-shrink-0 rounded-l-2xl"
                    style={{ background: active ? '#7c3aed' : expired ? '#9ca3af' : '#d97706' }} />

                  {/* Thumbnail */}
                  <div className="w-28 h-24 flex-shrink-0 overflow-hidden" style={{ background: offer.bgColor || '#ede9fe' }}>
                    {offer.imageUrl
                      ? <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                      : <div className="w-full h-full flex items-center justify-center"><Gift size={28} className="text-violet-300" /></div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 px-4 py-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-black text-gray-900 truncate">{offer.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black flex-shrink-0 ${
                            active    ? 'bg-emerald-100 text-emerald-700' :
                            expired   ? 'bg-gray-100 text-gray-500' :
                            offer.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-600'}`}>
                            {active ? '● Active' : expired ? '⏰ Expired' :
                             offer.status === 'scheduled' ? '📅 Scheduled' : '○ Inactive'}
                          </span>
                        </div>
                        {offer.subtitle && (
                          <p className="text-xs text-gray-500 truncate">{offer.subtitle}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {offer.badgeText && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background:'#7c3aed', color:'#fff' }}>{offer.badgeText}</span>
                          )}
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            {offer.offerType === 'category' ? <><Grid3X3 size={10} /> {getCatName(offer.linkedCatId)}</> :
                             offer.offerType === 'product'  ? <><Package size={10} /> {getProdName(offer.linkedProdId)}</> :
                             offer.offerType === 'multi'    ? <><Layers size={10} /> {offer.multiProdIds?.length || 0} products</> :
                             '🎉 General'}
                          </span>
                          {(offer.startDate || offer.endDate) && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Calendar size={10} />
                              {offer.startDate || '—'} → {offer.endDate || '—'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Order controls */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveOrder(offer, -1)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                          title="Move up">
                          <ArrowUp size={12} className="text-gray-600" />
                        </button>
                        <span className="text-[10px] font-black text-gray-400 text-center leading-none">{offer.displayOrder ?? 0}</span>
                        <button onClick={() => moveOrder(offer, 1)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                          title="Move down">
                          <ArrowDown size={12} className="text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => { setEditing(offer); setShowModal(true); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition">
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => toggleStatus(offer)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition ${
                          active ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                        {active ? <><EyeOff size={11}/> Deactivate</> : <><Eye size={11}/> Activate</>}
                      </button>
                      <button onClick={() => setConfirmDel(offer.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-[11px] font-bold text-red-500 hover:bg-red-50 transition">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#ede9fe' }}>
            <Gift size={16} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-black text-violet-900 mb-0.5">How it works</p>
            <p className="text-[11px] text-violet-700 leading-relaxed">
              Active offers appear as a swipeable carousel on the User Home page. Expired or inactive offers are hidden automatically.
              Use Display Order to control the sequence. Offers without dates are always shown while active.
            </p>
          </div>
        </div>

      </div>

      {showModal && (
        <OfferModal
          initial={editing}
          categories={categories}
          products={products}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDel}
        title="Delete Offer"
        message="This offer will be removed from the user home carousel immediately. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
        confirmLabel="Delete Offer"
      />
    </div>
  );
}
