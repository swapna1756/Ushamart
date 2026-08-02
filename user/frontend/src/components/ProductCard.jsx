import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { cart, addItem, removeItem } = useCart();
  const navigate = useNavigate();
  const qty = cart[product.id] || 0;
  const disc = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const img = product.images?.[0];
  const inStock = product.stock > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
      {/* Discount badge */}
      {disc > 0 && (
        <span className="absolute top-2 left-2 z-10 bg-secondary text-white text-[9px] font-black px-2 py-0.5 rounded-lg">
          {disc}% OFF
        </span>
      )}

      {/* Out of stock overlay */}
      {!inStock && (
        <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-2xl">
          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            Out of Stock
          </span>
        </div>
      )}

      {/* Image */}
      <div onClick={() => navigate(`/product/${product.id}`)}
        className="cursor-pointer h-28 bg-gray-50 flex items-center justify-center p-3">
        {img
          ? <img src={img} alt={product.name} className="max-h-full max-w-full object-contain"
              onError={e => { e.target.src = '/logo.png'; }} />
          : <div className="text-4xl">🛒</div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col px-2.5 pb-2.5 pt-2">
        {product.brand && (
          <span className="text-[8px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
            {product.brand}
          </span>
        )}
        <p onClick={() => navigate(`/product/${product.id}`)}
          className="cursor-pointer text-xs font-bold text-gray-900 leading-snug line-clamp-2 mb-1">
          {product.name}
        </p>
        {product.unit && (
          <span className="text-[10px] text-gray-400 mb-2">{product.unit}</span>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-auto mb-2">
          <span className="text-sm font-black text-gray-900">₹{product.price}</span>
          {product.mrp > product.price && (
            <span className="text-[10px] text-gray-400 line-through">₹{product.mrp}</span>
          )}
        </div>

        {/* Add to cart */}
        {qty > 0 ? (
          <div className="flex items-center justify-between rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#0B6F3A,#14a857)', height: '32px' }}>
            <button onClick={() => removeItem(product.id)} className="btn-press w-10 h-full flex items-center justify-center text-white">
              <Minus size={12} strokeWidth={3} />
            </button>
            <span className="text-white font-black text-sm">{qty}</span>
            <button onClick={() => addItem(product.id)} className="btn-press w-10 h-full flex items-center justify-center text-white">
              <Plus size={12} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button onClick={() => inStock && addItem(product.id)} disabled={!inStock}
            className="btn-press w-full flex items-center justify-center gap-1 text-xs font-bold h-8 rounded-xl border-2 transition"
            style={{ borderColor: inStock ? '#0B6F3A' : '#e5e7eb', color: inStock ? '#0B6F3A' : '#9ca3af',
              background: '#fff', cursor: inStock ? 'pointer' : 'not-allowed' }}>
            <Plus size={12} strokeWidth={3} /> ADD
          </button>
        )}
      </div>
    </div>
  );
}
