import React, { useState } from 'react';
import {
  MapPin, Plus, Trash2, Edit2, Check, X, Search,
  Truck, Clock, DollarSign, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle, Package
} from 'lucide-react';
import { db } from '../../db/mockFirebase';
import { ConfirmDialog } from './ConfirmDialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition placeholder:text-gray-400 bg-white";

export default function PincodeManagement({ pincodes, pincodeConfigs, addToast }) {
  const [search, setSearch]         = useState('');
  const [newPin, setNewPin]         = useState('');
  const [adding, setAdding]         = useState(false);
  const [pinError, setPinError]     = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  // Inline delivery config editing
  const [editingCode, setEditingCode]   = useState(null); // pincode string being edited
  const [editCharge, setEditCharge]     = useState('');
  const [editTime, setEditTime]         = useState('');
  const [editEnabled, setEditEnabled]   = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Build a merged list: every pincode with its config
  const rows = pincodes
    .filter(pin => !search || pin.includes(search.trim()))
    .map(pin => {
      const cfg = pincodeConfigs.find(c => c.code === pin);
      return { pin, cfg };
    });

  // ── Add pincode ──────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    setPinError('');
    const clean = newPin.trim();
    if (!/^\d{6}$/.test(clean)) { setPinError('Enter a valid 6-digit pincode.'); return; }
    if (pincodes.includes(clean)) { setPinError('Pincode already exists.'); return; }
    setAdding(true);
    try {
      await db.collection('pincodes').add(clean);
      // Auto-create a default config entry
      await db.collection('pincode_configs').add({
        code: clean,
        charges: 0,
        elapsedDaysText: '1-2 Days',
        enabled: true,
      });
      setNewPin('');
      addToast(`Pincode ${clean} added successfully`, 'success');
    } catch (err) {
      addToast('Failed to add pincode: ' + err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  // ── Delete pincode ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    const pin = confirmDel;
    setConfirmDel(null);
    try {
      await db.collection('pincodes').delete(pin);
      // Also remove its config if it exists
      const cfg = pincodeConfigs.find(c => c.code === pin);
      if (cfg) await db.collection('pincode_configs').delete(cfg.id);
      addToast(`Pincode ${pin} removed`, 'success');
    } catch (err) {
      addToast('Failed to delete: ' + err.message, 'error');
    }
  };

  // ── Open config editor ───────────────────────────────────────────────────
  const openEdit = (pin, cfg) => {
    setEditingCode(pin);
    setEditCharge(cfg?.charges ?? '0');
    setEditTime(cfg?.elapsedDaysText || '1-2 Days');
    setEditEnabled(cfg?.enabled !== false);
  };

  // ── Save config ──────────────────────────────────────────────────────────
  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const existing = pincodeConfigs.find(c => c.code === editingCode);
      const payload = {
        code: editingCode,
        charges: parseFloat(editCharge) || 0,
        elapsedDaysText: editTime,
        enabled: editEnabled,
      };
      if (existing) {
        await db.collection('pincode_configs').update(existing.id, payload);
      } else {
        await db.collection('pincode_configs').add(payload);
      }
      addToast(`Config saved for ${editingCode}`, 'success');
      setEditingCode(null);
    } catch (err) {
      addToast('Failed to save config: ' + err.message, 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const DELIVERY_TIMES = ['Same Day', '1-2 Days', '2-3 Days', '3-5 Days', '5-7 Days'];

  // ── KPI summary ──────────────────────────────────────────────────────────
  const totalEnabled  = pincodeConfigs.filter(c => c.enabled !== false).length;
  const totalDisabled = pincodeConfigs.filter(c => c.enabled === false).length;
  const freeDelivery  = pincodeConfigs.filter(c => (c.charges || 0) === 0).length;

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="px-6 py-5 bg-white border-b border-gray-100 flex-shrink-0">
        <h2 className="text-lg font-black text-gray-900">Pincode Management</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {pincodes.length} serviceable pincodes · controls where products are delivered
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Pincodes',   value: pincodes.length,   icon: MapPin,       color: 'bg-blue-50 text-blue-500' },
            { label: 'Active',           value: totalEnabled,       icon: CheckCircle,  color: 'bg-green-50 text-green-600' },
            { label: 'Disabled',         value: totalDisabled,      icon: AlertTriangle,color: 'bg-red-50 text-red-500' },
            { label: 'Free Delivery',    value: freeDelivery,       icon: Truck,        color: 'bg-purple-50 text-purple-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Add pincode card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={15} className="text-primary" /> Add New Serviceable Pincode
          </h3>
          <form onSubmit={handleAdd} className="flex gap-3 items-start">
            <div className="flex-1 max-w-xs">
              <input
                value={newPin}
                onChange={e => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
                className={inp + (pinError ? ' border-red-300 focus:border-red-400' : '')}
              />
              {pinError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertTriangle size={11}/>{pinError}</p>}
            </div>
            <button type="submit" disabled={adding || newPin.length !== 6}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-md shadow-primary/20">
              {adding ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Plus size={15}/>}
              Add Pincode
            </button>
          </form>
          <p className="text-[10px] text-gray-400 mt-2">
            Adding a pincode makes products available for delivery there. Configure delivery charges below.
          </p>
        </div>

        {/* ── Pincode list ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-gray-800">Serviceable Pincodes</h3>
            <div className="relative w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value.replace(/\D/g, ''))}
                placeholder="Filter by pincode…"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-16">
              <MapPin size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm font-semibold text-gray-400">No pincodes found</p>
              <p className="text-xs text-gray-300 mt-1">Add one above to enable deliveries</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Pincode</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Delivery Charge</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Est. Delivery Time</th>
                  <th className="px-5 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-center text-[10px] font-black text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(({ pin, cfg }) => (
                  <tr key={pin} className="hover:bg-gray-50/60 transition group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin size={14} className="text-primary" />
                        </div>
                        <span className="font-black text-gray-800 tracking-wider">{pin}</span>
                      </div>
                    </td>

                    {/* ── Config editor (inline) ── */}
                    {editingCode === pin ? (
                      <>
                        <td className="px-5 py-3">
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                            <input type="number" min="0" value={editCharge} onChange={e => setEditCharge(e.target.value)}
                              className="w-full border border-primary/40 rounded-xl pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <select value={editTime} onChange={e => setEditTime(e.target.value)}
                            className="border border-primary/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white appearance-none">
                            {DELIVERY_TIMES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button type="button" onClick={() => setEditEnabled(v => !v)}>
                            {editEnabled
                              ? <ToggleRight size={26} className="text-primary" />
                              : <ToggleLeft size={26} className="text-gray-300" />}
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={saveConfig} disabled={savingConfig}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition disabled:opacity-50">
                              <Check size={12}/> Save
                            </button>
                            <button onClick={() => setEditingCode(null)}
                              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-xs font-bold text-gray-500 rounded-lg hover:bg-gray-50 transition">
                              <X size={12}/> Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3.5">
                          <span className={`text-sm font-bold ${(cfg?.charges || 0) === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                            {(cfg?.charges || 0) === 0 ? 'Free' : `₹${cfg.charges}`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock size={13} className="text-gray-400" />
                            <span className="text-sm">{cfg?.elapsedDaysText || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {cfg?.enabled !== false
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"/> Active
                              </span>
                            : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"/> Disabled
                              </span>
                          }
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => openEdit(pin, cfg)}
                              className="w-7 h-7 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-gray-400 transition" title="Edit config">
                              <Edit2 size={13}/>
                            </button>
                            <button onClick={() => setConfirmDel(pin)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-400 transition" title="Delete pincode">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info note */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <Package size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>How this works:</strong> Only pincodes listed here will be accepted in the user portal.
            Products must also have the matching pincode selected in their delivery settings to appear for that area.
            Users entering an unrecognised pincode will see the list of your serviceable areas.
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDel}
        title="Delete Pincode"
        message={`Remove pincode ${confirmDel}? Products assigned only to this pincode will become invisible to users in that area.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}
