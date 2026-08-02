import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { productsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

const WISHLIST_KEY = 'ushamart_wishlist';

export function useWishlist() {
  const [ids, setIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')); }
    catch { return new Set(); }
  });

  const toggle = (id) => setIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify([...next]));
    return next;
  });

  const has = (id) => ids.has(id);
  return { ids, toggle, has, count: ids.size };
}

export default function WishlistPage() {
  const navigate = useNavigate();
  const { pincode } = useCart();
  const { ids, toggle } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    productsApi.getAll()
      .then(r => setProducts(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const wished = products.filter(p => ids.has(p.id));

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Heart size={18} className="text-secondary" /> My Wishlist
        </h1>
        {wished.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{wished.length} saved item{wished.length !== 1 ? 's' : ''}</p>}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-20">
        {wished.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">♡</span>
            <h2 className="text-base font-black text-gray-700">Your wishlist is empty</h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">Tap the heart on any product to save it here</p>
            <button onClick={() => navigate('/home')}
              className="btn-press px-5 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background:'linear-gradient(135deg,#0B6F3A,#14a857)' }}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {wished.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
