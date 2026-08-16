import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { categoriesApi } from '../services/api';
import { useToast } from '../components/Toast';
import ImageUploader from '../components/ImageUploader';

export default function CategoryEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const EMPTY = { name: '', description: '', emojiIcon: '', icon: '', status: 'published', featured: false, displayOrder: 0 };
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    categoriesApi.getAll()
      .then(r => {
        const found = (r.data || []).find(c => c.id === id);
        if (found) {
          setForm({ ...EMPTY, ...found });
        } else {
          addToast('Category not found', 'error');
          navigate('/categories');
        }
      })
      .catch(e => addToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await categoriesApi.update(id, form);
      addToast('Category updated successfully', 'success');
      navigate('/categories');
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

  const fi = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/categories')} className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 transition" aria-label="Go back">
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Category Management</span>
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">Edit Category</h1>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-press px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50">
          {saving ? <Loader2 size={13} className="spin" /> : <CheckCircle size={13} />}
          {saving ? 'Saving...' : 'Save Updates'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Category Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Fruits & Vegetables" className={fi} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Emoji Icon</label>
              <input value={form.emojiIcon} onChange={e => set('emojiIcon', e.target.value)} placeholder="e.g. 🍎" maxLength={4} className={fi} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Describe this category..." className={fi + ' resize-none'} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Media & Placement</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={e => set('displayOrder', e.target.value)} className={fi} />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={fi + ' cursor-pointer'}>
                <option value="published">Published</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <ImageUploader label="Category Image" value={form.icon} onChange={url => set('icon', url)} hint="JPG, PNG, WebP • Max 5 MB" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="w-4 h-4 accent-primary rounded cursor-pointer" />
              <span className="text-xs font-semibold text-gray-700">Feature this category on the homepage</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
