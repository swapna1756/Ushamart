import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import { productsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function WishlistPage() {
  const navigate          = useNavigate();
  const { addItem }       = useCart();
  const { ids, toggle, clearAll, loading: wLoading } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    productsApi.getAll()
      .then(r => setProducts(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // All products in wishlist (including out-of-stock ones)
  const wished = products.filter(p => ids.has(p.id));
  // Also show ids that are in wishlist but product wasn't fetched (deleted products)
  const missingIds = [...ids].filter(id => !products.find(p => p.id === id));

  if (loading || wLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Heart size={18} className="text-secondary fill-secondary" /> My Wishlist
          </h1>
          {wished.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{wished.length} saved item{wished.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        {wished.length > 0 && (
          <button onClick={() => clearAll()}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition">
            <Trash2 size={12} /> Clear All
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-20">
        {wished.length === 0 && missingIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Heart size={36} className="text-red-200" />
            </div>
            <h2 className="text-base font-black text-gray-700">Your wishlist is empty</h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">Tap the ♡ on any product to save it here</p>
            <button onClick={() => navigate('/home')}
              className="btn-press px-5 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#0B6F3A,#14a857)' }}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {wished.map(product => {
              const inStock = product.stock > 0;
              const disc    = product.mrp > product.price
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

              return (
                <div key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex gap-3 p-3">
                  {/* Image */}
                  <div onClick={() => navigate(`/product/${product.id}`)}
                    className="cursor-pointer w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name}
                          className="w-full h-full object-contain p-1"
                          onError={e => e.target.src = '/logo.png'} />
                      : <span className="text-2xl">🛒</span>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {product.brand && (
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{product.brand}</p>
                    )}
                    <p onClick={() => navigate(`/product/${product.id}`)}
                      className="cursor-pointer text-sm font-bold text-gray-900 leading-snug line-clamp-2 mt-0.5">
                      {product.name}
                    </p>
                    {product.unit && <p className="text-[10px] text-gray-400 mt-0.5">{product.unit}</p>}

                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-black text-gray-900">₹{product.price}</span>
                      {product.mrp > product.price && (
                        <span className="text-[10px] text-gray-400 line-through">₹{product.mrp}</span>
                      )}
                      {disc > 0 && (
                        <span className="text-[9px] font-black text-green-600">{disc}% off</span>
                      )}
                    </div>

                    {/* Stock status */}
                    {!inStock && (
                      <span className="inline-block mt-1 text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        Out of Stock
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      <button
                        disabled={!inStock}
                        onClick={() => { if (inStock) { addItem(product.id); navigate('/cart'); } }}
                        className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 justify-center"
                        style={{
                          background: inStock ? 'linear-gradient(135deg,#0B6F3A,#14a857)' : '#f3f4f6',
                          color:      inStock ? '#fff' : '#9ca3af',
                          cursor:     inStock ? 'pointer' : 'not-allowed',
                        }}>
                        <ShoppingCart size={11} /> {inStock ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                      <button onClick={() => toggle(product.id)}
                        className="btn-press w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 transition flex-shrink-0">
                        <X size={13} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Missing products (deleted from catalog) */}
            {missingIds.map(id => (
              <div key={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 opacity-50">
                <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-500">Product no longer available</p>
                  <button onClick={() => toggle(id)}
                    className="mt-1 text-xs text-red-400 hover:text-red-600 font-semibold">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
