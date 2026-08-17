/**
 * ImageUploader — Universal image input component.
 * Supports:
 *   1. Upload from local device (drag-and-drop or file picker)
 *   2. Enter image URL manually
 *   3. Preview before saving
 *   4. Remove / replace image
 */
import React, { useState, useRef } from 'react';
import { Upload, Link, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { uploadApi } from '../services/api';
import { resolveImageUrl } from '../utils/asset';

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_MB   = 5;

export default function ImageUploader({
  value       = '',          // current image URL
  onChange,                  // (url: string) => void
  label       = 'Image',
  hint        = 'JPG, PNG, WebP · Max 5 MB',
  required    = false,
  className   = '',
}) {
  const [tab,     setTab]     = useState('upload'); // 'upload' | 'url'
  const [urlInput,setUrlInput]= useState('');
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState('');
  const [dragOver,setDragOver]= useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    setError('');

    if (!ACCEPTED.includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are supported.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_MB} MB.`);
      return;
    }

    setBusy(true);
    try {
      const res = await uploadApi.image(file);
      onChange(res.url);
    } catch (err) {
      setError(err.message || 'Category image upload failed. Please try again.');
    }
    setBusy(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const applyUrl = () => {
    const url = urlInput.trim();
    if (!url) { setError('Please enter a URL.'); return; }
    if (!/^https?:\/\/.+/.test(url)) { setError('Please enter a valid http/https URL.'); return; }
    setError('');
    onChange(url);
    setUrlInput('');
  };

  const remove = () => { onChange(''); setError(''); };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </p>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[['upload','Upload File'],['url','Image URL']].map(([id,lbl])=>(
          <button key={id} type="button" onClick={()=>{setTab(id);setError('');}}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${tab===id?'bg-white text-gray-800 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            {id==='upload' ? <span className="flex items-center gap-1"><Upload size={11}/>{lbl}</span>
                           : <span className="flex items-center gap-1"><Link size={11}/>{lbl}</span>}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={handleDrop}
          onClick={()=>!busy&&inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition cursor-pointer
            ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5'}
            ${busy ? 'pointer-events-none opacity-70' : ''}`}
          style={{ minHeight: value ? '0' : '100px' }}>
          <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} className="hidden"
            onChange={e=>{ handleFiles(e.target.files); e.target.value=''; }}/>
          {busy ? (
            <div className="py-8 flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-primary spin"/>
              <span className="text-xs text-gray-500 font-medium">Uploading…</span>
            </div>
          ) : !value ? (
            <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
              <Upload size={24}/>
              <span className="text-xs font-semibold">Drop image here or click to upload</span>
              <span className="text-[10px]">{hint}</span>
            </div>
          ) : null}
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={e=>{setUrlInput(e.target.value);setError('');}}
            onKeyDown={e=>e.key==='Enter'&&applyUrl()}
            placeholder="https://example.com/image.jpg"
            className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          />
          <button type="button" onClick={applyUrl}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition flex-shrink-0">
            Apply
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
          <AlertCircle size={13}/> {error}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative group rounded-2xl overflow-hidden border border-gray-200 bg-gray-50"
          style={{ maxHeight: '180px' }}>
          <img src={value} alt="Preview"
            className="w-full h-full object-cover"
            style={{ maxHeight: '180px' }}
            onError={e=>{ e.target.style.opacity='0.3'; }}/>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-3">
            <button type="button" onClick={()=>tab==='upload'?inputRef.current?.click():setTab('url')}
              className="opacity-0 group-hover:opacity-100 transition bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow">
              Replace
            </button>
            <button type="button" onClick={remove}
              className="opacity-0 group-hover:opacity-100 transition bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">
              Remove
            </button>
          </div>
          {/* Main badge */}
          <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full">
            ✓ Image set
          </span>
        </div>
      )}
    </div>
  );
}
