import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Loader2, ToggleLeft, ToggleRight, MapPin, Search } from 'lucide-react';
import { pincodesApi } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

function PincodeModal({ isOpen, onClose, onSave, editing, pins }) {
  const { addToast } = useToast();
  const EMPTY = { code: '', areaName: '', city: '', district: '', state: '', latitude: '', longitude: '', enabled: true, charges: 0, deliveryTime: '1-2 Days' };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(editing ? {
        code: editing.code || editing.id || '',
        areaName: editing.areaName || '',
        city: editing.city || '',
        district: editing.district || '',
        state: editing.state || '',
        latitude: editing.latitude || '',
        longitude: editing.longitude || '',
        enabled: editing.enabled !== false,
        charges: editing.charges ?? 0,
        deliveryTime: editing.deliveryTime || '1-2 Days'
      } : EMPTY);
    }
  }, [editing, isOpen]);

  if (!isOpen) return null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const cleanCode = form.code.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      addToast('Pincode must be exactly 6 digits.', 'error');
      return;
    }
    
    // Duplicate check for new pincodes
    if (!editing && pins.some(p => (p.code || p.id) === cleanCode)) {
      addToast(`${cleanCode} is already serviceable.`, 'error');
      return;
    }

    setSaving(true);
    try {
      await onSave(form, editing ? editing.code || editing.id : null);
      onClose();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const fi = 'w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg animate-pop shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{editing ? 'Edit Pincode' : 'Add Serviceable Pincode'}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"><X size={14} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Pincode *</label>
              <input value={form.code} disabled={!!editing} onChange={e => set('code', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" maxLength={6} className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Area / Sector</label>
              <input value={form.areaName} onChange={e => set('areaName', e.target.value)} placeholder="e.g. Sector 4" className={fi} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Visakhapatnam" className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">District</label>
              <input value={form.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Vizag" className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">State</label>
              <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Andhra Pradesh" className={fi} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Latitude</label>
              <input type="number" value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="e.g. 17.6868" className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Longitude</label>
              <input type="number" value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="e.g. 83.2185" className={fi} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Delivery Charge (₹)</label>
              <input type="number" min="0" value={form.charges} onChange={e => set('charges', e.target.value)} className={fi} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Est. Delivery Time</label>
              <select value={form.deliveryTime} onChange={e => set('deliveryTime', e.target.value)} className={fi + ' cursor-pointer'}>
                <option value="Same Day">Same Day</option>
                <option value="1-2 Days">1-2 Days</option>
                <option value="2-3 Days">2-3 Days</option>
                <option value="3-5 Days">3-5 Days</option>
                <option value="5-7 Days">5-7 Days</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.enabled} onChange={e => set('enabled', e.target.checked)} className="w-4 h-4 accent-primary rounded cursor-pointer" />
              <span className="text-xs font-semibold text-gray-700">Mark as Serviceable / Enabled</span>
            </label>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5 transition">
            {saving ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PincodesPage() {
  const { addToast } = useToast();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

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

  const handleSave = async (form, code) => {
    if (code) {
      await pincodesApi.update(code, form);
      addToast('Pincode updated successfully', 'success');
    } else {
      await pincodesApi.create(form);
      addToast('Pincode added successfully', 'success');
    }
    await load();
  };

  const handleToggle = async pin => {
    const nextEnabled = !pin.enabled;
    const code = pin.code || pin.id;
    try {
      await pincodesApi.update(code, { enabled: nextEnabled });
      setPins(prev => prev.map(p => (p.code || p.id) === code ? { ...p, enabled: nextEnabled } : p));
      addToast(`Pincode ${code} ${nextEnabled ? 'enabled' : 'disabled'}`, 'info');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleDelete = async () => {
    const code = confirmDel;
    setConfirmDel(null);
    try {
      await pincodesApi.delete(code);
      addToast(`Pincode ${code} deleted`, 'success');
      await load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const filtered = pins.filter(p => {
    const q = search.toLowerCase();
    const code = String(p.code || p.id || '').toLowerCase();
    const area = String(p.areaName || '').toLowerCase();
    const city = String(p.city || '').toLowerCase();
    const dist = String(p.district || '').toLowerCase();
    const state = String(p.state || '').toLowerCase();
    return !q || code.includes(q) || area.includes(q) || city.includes(q) || dist.includes(q) || state.includes(q);
  });

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" /></div>;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Pincode Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">{pins.length} configured pincodes</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-sm transition">
          <Plus size={14} /> Add Pincode
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active Pincodes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{pins.filter(p => p.enabled !== false).length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">States Covered</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{new Set(pins.map(p => p.state).filter(Boolean)).size}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Cities Covered</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{new Set(pins.map(p => p.city).filter(Boolean)).size}</p>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search state, city, pincode..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-sm" />
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <MapPin size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-400 font-semibold">No serviceable locations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider">
                    {['Pincode', 'Area/City/State', 'Delivery Charge', 'Est. Time', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-[10px] font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(p => {
                    const code = p.code || p.id;
                    const chargeString = (p.charges || 0) === 0 ? 'Free' : `₹${p.charges}`;
                    return (
                      <tr key={code} className="hover:bg-gray-50/50 transition group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><MapPin size={13} className="text-primary" /></div>
                            <span className="font-bold text-gray-900">{code}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-800">{p.areaName || '—'}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{[p.city, p.district, p.state].filter(Boolean).join(', ')}</p>
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-900">{chargeString}</td>
                        <td className="px-5 py-4 text-gray-600 font-medium">{p.deliveryTime || '—'}</td>
                        <td className="px-5 py-4">
                          {p.enabled !== false ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Serviceable</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Not Serviceable</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => { setEditing(p); setModalOpen(true); }} title="Edit" className="w-7 h-7 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-gray-400 flex items-center justify-center transition"><Edit2 size={12} /></button>
                            <button onClick={() => handleToggle(p)} title={p.enabled !== false ? "Disable" : "Enable"} className="w-7 h-7 rounded-lg hover:bg-yellow-50 hover:text-yellow-600 text-gray-400 flex items-center justify-center transition">
                              {p.enabled !== false ? <ToggleRight size={16} className="text-primary" /> : <ToggleLeft size={16} />}
                            </button>
                            <button onClick={() => setConfirmDel(code)} title="Delete" className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PincodeModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} editing={editing} pins={pins} />
      <ConfirmDialog isOpen={!!confirmDel} title="Delete Pincode" message={`Remove pincode ${confirmDel}? Products assigned only to this pincode will become unavailable in that area.`} onConfirm={handleDelete} onCancel={() => setConfirmDel(null)} confirmLabel="Delete" />
    </div>
  );
}
