import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { resolveImageUrl } from '../utils/asset';
import { formatINR } from '../utils/currency';

export default function ProductCard({ product }) {
 const { cart, addItem, removeItem } = useCart();
 const { has, toggle } = useWishlist();
 const navigate = useNavigate();
 const qty = cart[product.id] || 0;
 const liked = has(product.id);
 const disc = product.mrp > product.price
 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
 const img = product.images?.[0];
 const inStock = product.stock > 0;

 return (
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow relative flex flex-col min-w-0 h-full">
 {/* Discount badge */}
 {disc > 0 && (
 <span className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10 bg-secondary text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
 {disc}% off
 </span>
 )}

 {/* Wishlist heart */}
 <button
 onClick={e => { e.stopPropagation(); toggle(product.id); }}
 className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10 btn-press w-8 h-8 rounded-full flex items-center justify-center transition"
 style={{
 background: liked ? '#E7F5ED' : 'rgba(255,255,255,0.92)',
 border: `1px solid ${liked ? '#1A9E48' : '#e5e7eb'}`,
 }}
 aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
 >
 <Heart size={14} fill={liked ? '#1A9E48' : 'none'} stroke={liked ? '#1A9E48' : '#9ca3af'} strokeWidth={2} />
 </button>

 {/* Out of stock overlay */}
 {!inStock && (
 <div className="absolute inset-0 z-10 bg-white/75 flex items-center justify-center rounded-xl">
 <span className="text-[11px] font-medium text-gray-500 bg-white px-2.5 py-1 rounded border border-gray-200">
 Out of Stock
 </span>
 </div>
 )}

 {/* Image */}
 <div
 onClick={() => navigate(`/product/${product.id}`)}
 className="cursor-pointer aspect-square bg-gray-50 flex items-center justify-center p-2 sm:p-3"
 >
 {img
 ? <img src={resolveImageUrl(img)} alt={product.name} loading="lazy" className="w-full h-full object-contain"
 onError={e => { e.target.src = '/logo.png'; }} />
 : <img src="/logo.png" alt={product.name} loading="lazy" className="w-16 h-16 object-contain opacity-80" />}
 </div>

 {/* Info */}
 <div className="flex-1 flex flex-col min-w-0 px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2">
 {product.brand && (
 <span className="text-[10px] sm:text-xs text-muted mb-0.5 truncate">{product.brand}</span>
 )}
 <p
 onClick={() => navigate(`/product/${product.id}`)}
 className="cursor-pointer text-[13px] sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1 break-words"
 >
 {product.name}
 </p>
 {product.unit && <span className="text-xs text-muted mb-2 truncate">{product.unit}</span>}

 {/* Price */}
 <div className="mt-auto mb-2 min-w-0">
   <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
     <span className="text-sm sm:text-[15px] font-bold text-primary">{formatINR(product.price)}</span>
     {product.mrp > product.price && (
       <span className="text-xs text-muted line-through">{formatINR(product.mrp)}</span>
     )}
   </div>
   {product.mrp > product.price && (
     <p className="text-[10px] sm:text-xs font-bold text-savings mt-0.5">You Save {formatINR(product.mrp - product.price)}</p>
   )}
 </div>

 {/* Add to cart */}
 {qty > 0 ? (
 <div
 className="flex items-center justify-between rounded-lg overflow-hidden bg-primary"
 style={{ minHeight: '36px' }}
 >
 <button onClick={() => removeItem(product.id)} className="btn-press w-10 min-h-9 flex items-center justify-center text-white">
 <Minus size={14} strokeWidth={2.5} />
 </button>
 <span className="text-white font-semibold text-sm">{qty}</span>
 <button onClick={() => addItem(product.id)} className="btn-press w-10 min-h-9 flex items-center justify-center text-white">
 <Plus size={14} strokeWidth={2.5} />
 </button>
 </div>
 ) : (
 <button
 onClick={() => inStock && addItem(product.id)}
 disabled={!inStock}
 className={`btn-press w-full min-h-9 flex items-center justify-center gap-1 text-sm font-medium rounded-lg border transition ${
   inStock ? 'border-primary text-primary hover:bg-primary/5' : 'border-gray-200 text-gray-400'
 }`}
 style={{
   background: '#fff',
   cursor: inStock ? 'pointer' : 'not-allowed',
 }}
 >
 <Plus size={14} strokeWidth={2.5} /> Add
 </button>
 )}
 </div>
 </div>
 );
}
