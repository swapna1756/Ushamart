import React, { useState, useRef } from 'react';
import {
  Plus, Edit2, Trash2, X, Check, Loader2, ImageIcon,
  Eye, EyeOff, Star, AlertCircle, MoveUp, MoveDown,
  Megaphone, Calendar, ExternalLink, ToggleLeft, ToggleRight
} from 'lucide-react';
import { db, storage } from '../../db/mockFirebase';
import { ConfirmDialog } from './ConfirmDialog';

const inp = [
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800',
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
  'transition placeholder:text-gray-400 bg-white'
].join(' ');

// ── Fallback default banners shown on user side when admin hasn't created any ──
export const DEFAULT_FALLBACK_BANNERS = [
  {
    id: 'fallback_1',
    title: 'Kids Snack Corner',
    subtitle: 'Tasty little treats for happy little moments.',
    badgeText: 'SPECIAL',
    buttonText: 'Explore Snacks',
    buttonDest: 'snacks',
    bgGradient: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#c084fc 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
    active: true,
    isFallback: true,
  },
  {
    id: 'fallback_2',
    title: 'Fresh Picks Today',
    subtitle: 'Farm-fresh produce delivered to your door.',
    badgeText: 'TODAY ONLY',
    buttonText: 'Shop Fresh',
    buttonDest: 'fruits',
    bgGradient: 'linear-gradient(135deg,#166534 0%,#16a34a 60%,#4ade80 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80',
    active: true,
    isFallback: true,
  },
  {
    id: 'fallback_3',
    title: 'Healthy Morning',
    subtitle: 'Start your day with nutritious essentials.',
    badgeText: 'WELLNESS',
    buttonText: 'Shop Now',
    buttonDest: 'health',
    bgGradient: 'linear-gradient(135deg,#d97706 0%,#f59e0b 60%,#fcd34d 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&q=80',
    active: true,
    isFallback: true,
  },
];

// ── Image Picker ──────────────────────────────────────────────────────────────
function ImagePicker({ label, value, onChange, hint }) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const pick = async (files) => {
    if (!files?.length) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) return;
    setBusy(true);
    try {
      let url;
      try { url = await storage.uploadImage(f); }
      catch {
        url = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(f);
        });
      }
      onChange(url);
    } finally { setBusy(false); }
  };

  return (
    <div>
      {label && <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>}
      <div
        onClick={() => fileRef.current?.click()}
        className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer overflow-hidden transition-all hover:border-emerald-400 hover:bg-emerald-50/30 group"
        style={{ height: value ? '140px' : '90px' }}
      >
        {busy ? <Loader2 size={22} className="text-emerald-500 animate-spin" /> :
         value ? (
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
        <button type="button" onClick={() => onChange('')}
          className="text-[11px] text-red-400 hover:text-red-600 mt-1 font-medium">
          Remove image
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { pick(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
