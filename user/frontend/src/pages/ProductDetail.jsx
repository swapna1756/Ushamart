import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Package, Heart } from 'lucide-react';
import { productsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { cart, addItem, removeItem } = useCart();
  const { has, toggle } = useWishlist();
  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [imgIdx,   setImgIdx]   = useState(0);

  useEffect(() => {
    productsApi.getById(id)
      .then(r => setProduct(r.data))
      .catch(() => navigate('/home', { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );
  if (!product) return null;

  const qty     = cart[product.id] || 0;
  const liked   = has(product.id);
  const disc    = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const savings = product.mrp > product.price ? product.mrp - product.price : 0;
  const imgs    = product.images?.length > 0 ? product.images : [];
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Back button */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="btn-press w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-900 truncate flex-1">{product.name}</span>
        {/* Wishlist heart */}
        <button onClick={() => toggle(product.id)}
          className="btn-press w-9 h-9 rounded-xl flex items-center justify-center transition"
          style={{ background: liked ? '#fff0f0' : '#f3f4f6', border: `1.5px solid ${liked ? '#fca5a5' : '#e5e7eb'}` }}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}>
          <Heart size={16} fill={liked ? '#EE4224' : 'none'} stroke={liked ? '#EE4224' : '#6b7280'} strokeWidth={2}/>
        </button>
        <button onClick={() => navigate('/cart')}
          className="btn-press relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ShoppingCart size={16} className="text-gray-600" />
          {Object.values(cart).reduce((a,b) => a+b, 0) > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-white text-[8px] font-black rounded-full flex items-center justify-center">
              {Object.values(cart).reduce((a,b) => a+b, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Image gallery */}
      <div className="relative bg-gray-50" style={{ height: '280px' }}>
        {imgs.length > 0 ? (
          <>
            <img src={imgs[imgIdx]} alt={product.name}
              className="w-full h-full object-contain p-6"
              onError={e => { e.target.src = '/logo.png'; }} />
            {imgs.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imgs.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className="h-1.5 rounded-full transition-all" style={{ width: i === imgIdx ? '18px' : '6px', background: i === imgIdx ? '#0B6F3A' : '#d1d5db' }} />
                ))}
              </div>
            )}
            {imgs.length > 1 && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {imgs.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 bg-white transition ${i === imgIdx ? 'border-primary' : 'border-gray-200'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={64} className="text-gray-200" />
          </div>
        )}
        {disc > 0 && (
          <span className="absolute top-4 right-4 bg-secondary text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
            {disc}% OFF
          </span>
        )}
      </div>

      {/* Product info */}
      <div className="px-4 pt-5 pb-32 space-y-4 max-w-2xl mx-auto">
        {product.brand && (
          <span className="inline-block bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            {product.brand}
          </span>
        )}
        <h1 className="text-xl font-black text-gray-900 leading-tight">{product.name}</h1>
        {product.unit && <p className="text-sm text-gray-500">{product.unit}</p>}

        {/* Stock status */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-sm font-bold ${inStock ? 'text-green-600' : 'text-red-500'}`}>
            {inStock ? `In Stock · ${product.stock} units` : 'Out of Stock'}
          </span>
        </div>

        {/* Price card */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-gray-400 font-medium uppercase mb-0.5">Our Price</p>
              <p className="text-3xl font-black text-gray-900">₹{product.price}</p>
            </div>
            {product.mrp > product.price && (
              <>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase mb-0.5">MRP</p>
                  <p className="text-lg font-semibold text-gray-400 line-through">₹{product.mrp}</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase mb-0.5">You Save</p>
                  <p className="text-lg font-black text-green-600">₹{savings} ({disc}%)</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mock rating */}
        <div className="flex items-center gap-1.5">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={14} className={s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
          ))}
          <span className="text-xs font-semibold text-gray-600 ml-1">4.0 · 124 reviews</span>
        </div>

        {/* Description */}
        {product.description && (
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-2">Product Details</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* SKU / Barcode */}
        {(product.sku || product.barcode) && (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            {product.sku && <p className="text-[10px] text-gray-400">SKU: <span className="font-mono font-bold text-gray-600">{product.sku}</span></p>}
            {product.barcode && <p className="text-[10px] text-gray-400 mt-0.5">Barcode: <span className="font-mono font-bold text-gray-600">{product.barcode}</span></p>}
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Qty stepper */}
          {qty > 0 && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 flex-shrink-0">
              <button onClick={() => removeItem(product.id)} className="btn-press w-7 h-7 flex items-center justify-center font-black text-lg text-gray-700">−</button>
              <span className="text-sm font-black text-gray-900 w-5 text-center">{qty}</span>
              <button onClick={() => addItem(product.id)} className="btn-press w-7 h-7 flex items-center justify-center font-black text-lg text-gray-700">+</button>
            </div>
          )}

          {/* Add to basket */}
          <button disabled={!inStock} onClick={() => { if (inStock && qty === 0) addItem(product.id); }}
            className="btn-press flex-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
            style={{ background: qty > 0 ? '#f0fdf4' : 'linear-gradient(135deg,#0B6F3A,#14a857)', color: qty > 0 ? '#0B6F3A' : '#fff',
              border: qty > 0 ? '2px solid #0B6F3A' : 'none', boxShadow: qty > 0 ? 'none' : '0 4px 14px rgba(11,111,58,0.35)' }}>
            <ShoppingCart size={16} />
            {qty > 0 ? `${qty} in basket` : inStock ? 'Add to Basket' : 'Out of Stock'}
          </button>

          {/* Buy Now */}
          {inStock && (
            <button onClick={() => { if (qty === 0) addItem(product.id); navigate('/cart'); }}
              className="btn-press flex-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center"
              style={{ background: '#0B6F3A', boxShadow: '0 4px 14px rgba(11,111,58,0.35)' }}>
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
