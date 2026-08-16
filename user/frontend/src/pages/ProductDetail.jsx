import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Package, Heart } from 'lucide-react';
import { productsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { resolveImageUrl } from '../utils/asset';
import { formatINR } from '../utils/currency';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addItem, removeItem } = useCart();
  const { has, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState('');

  useEffect(() => {
    productsApi.getById(id)
      .then(r => {
        setProduct(r.data);
        if (r.data && r.data.variantList && r.data.variantList.length > 0) {
          setSelectedVariant(r.data.variantList[0].unit);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-sm font-semibold text-gray-500">Product not found</p>
      <button onClick={() => navigate('/home')} className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold">
        Back to Home
      </button>
    </div>
  );

  // Variant overrides
  const activeVariant = (product.variantList || []).find(v => v.unit === selectedVariant);
  const price = activeVariant ? activeVariant.price : product.price;
  const mrp = activeVariant ? (activeVariant.mrp || activeVariant.price) : product.mrp;
  const stock = activeVariant ? activeVariant.stock : product.stock;
  const unit = activeVariant ? activeVariant.unit : product.unit;
  const cartKey = selectedVariant ? `${product.id}::${selectedVariant}` : product.id;

  const qty = cart[cartKey] || 0;
  const liked = has(product.id);
  const inStock = stock > 0;
  const disc = mrp > price
    ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const savings = Math.max(0, mrp - price);

  const imgs = Array.isArray(product.images) ? product.images : [];

  return (
    <div className="min-h-screen bg-white pb-36 lg:pb-12">
      {/* Back button header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="btn-press w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <span className="text-sm font-medium text-gray-900 truncate flex-1">{product.name}</span>
        {/* Wishlist heart */}
        <button onClick={() => toggle(product.id)}
          className="btn-press w-9 h-9 rounded-xl flex items-center justify-center transition"
          style={{ background: liked ? '#E7F5ED' : '#f3f4f6', border: `1.5px solid ${liked ? '#1A9E48' : '#e5e7eb'}` }}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}>
          <Heart size={16} fill={liked ? '#1A9E48' : 'none'} stroke={liked ? '#1A9E48' : '#6b7280'} strokeWidth={2}/>
        </button>
        <button onClick={() => navigate('/cart')}
          className="btn-press relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ShoppingCart size={16} className="text-gray-600" />
          {Object.values(cart).reduce((a,b) => a+b, 0) > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-white text-[10px] font-medium rounded-full flex items-center justify-center">
              {Object.values(cart).reduce((a,b) => a+b, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Image gallery */}
        <div className="relative bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden" style={{ minHeight: '280px', height: '340px' }}>
          {imgs.length > 0 ? (
            <>
              <img src={resolveImageUrl(imgs[imgIdx])} alt={product.name}
                className="w-full h-full object-contain p-6"
                onError={e => { e.target.src = '/logo.png'; }} />
              {imgs.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {imgs.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className="h-1.5 rounded-full transition-all" style={{ width: i === imgIdx ? '18px' : '6px', background: i === imgIdx ? '#1A9E48' : '#d1d5db' }} />
                  ))}
                </div>
              )}
              {imgs.length > 1 && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                  {imgs.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-10 h-10 rounded-lg overflow-hidden border-2 bg-white transition ${i === imgIdx ? 'border-primary' : 'border-gray-200'}`}>
                      <img src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
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
            <span className="absolute top-4 right-4 z-10 bg-secondary text-white text-xs font-medium px-2.5 py-1 rounded-xl shadow-md">
              {disc}% OFF
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-4">
          {product.brand && (
            <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
              {product.brand}
            </span>
          )}
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">{product.name}</h1>
          {unit && <p className="text-sm text-gray-500">{unit}</p>}

          {/* Variants Selectable buttons */}
          {product.variantList && product.variantList.length > 0 && (
            <div className="space-y-2 pt-2 pb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Select Size:</span>
              <div className="flex flex-wrap gap-2">
                {product.variantList.map(v => (
                  <button key={v.unit} onClick={() => setSelectedVariant(v.unit)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-150 ${selectedVariant === v.unit ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                    {v.unit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-primary' : 'bg-red-500'}`} />
            <span className={`text-sm font-semibold ${inStock ? 'text-primary' : 'text-red-500'}`}>
              {inStock ? `In Stock • ${stock} units` : 'Out of Stock'}
            </span>
          </div>

          {/* Price card */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Our Price</p>
                <p className="text-2xl font-bold text-primary">{formatINR(price)}</p>
              </div>
              {mrp > price && (
                <>
                  <div className="w-px h-12 bg-gray-200" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">MRP</p>
                    <p className="text-lg font-semibold text-gray-400 line-through">{formatINR(mrp)}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-200" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">You Save</p>
                    <p className="text-lg font-bold text-savings">{formatINR(savings)} ({disc}%)</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={14} className={s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
            ))}
            <span className="text-xs font-semibold text-gray-600 ml-1">4.0 • 124 reviews</span>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1.5">Product Details</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* SKU / Barcode */}
          {(product.sku || product.barcode) && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              {product.sku && <p className="text-xs text-muted">SKU: <span className="font-mono font-medium text-gray-600">{product.sku}</span></p>}
              {product.barcode && <p className="text-xs text-muted mt-0.5">Barcode: <span className="font-mono font-medium text-gray-600">{product.barcode}</span></p>}
            </div>
          )}

          {/* Desktop Inline Actions */}
          <div className="hidden md:flex items-center gap-3 pt-4 border-t border-gray-100">
            {qty > 0 && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 flex-shrink-0">
                <button onClick={() => removeItem(cartKey)} className="btn-press w-7 h-7 flex items-center justify-center font-semibold text-base text-gray-700">-</button>
                <span className="text-sm font-semibold text-primary w-5 text-center">{qty}</span>
                <button onClick={() => addItem(cartKey)} className="btn-press w-7 h-7 flex items-center justify-center font-semibold text-base text-gray-700">+</button>
              </div>
            )}
            <button disabled={!inStock} onClick={() => { if (inStock && qty === 0) addItem(cartKey); }}
              className="btn-press flex-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
              style={{
                background: qty > 0 ? '#E7F5ED' : '#1A9E48',
                color: qty > 0 ? '#1A9E48' : '#fff',
                border: qty > 0 ? '2px solid #1A9E48' : 'none',
                boxShadow: qty > 0 ? 'none' : '0 4px 14px rgba(26,158,72,0.3)'
              }}>
              <ShoppingCart size={16} />
              {qty > 0 ? `${qty} in basket` : inStock ? 'Add to Basket' : 'Out of Stock'}
            </button>
            {inStock && (
              <button onClick={() => {
                const buyNowData = { productId: cartKey, quantity: Math.max(1, qty || 1), product: { ...product, price, mrp, unit, stock } };
                try { sessionStorage.setItem('ushamart_buynow', JSON.stringify(buyNowData)); } catch(e){}
                navigate('/checkout', { state: { buyNow: buyNowData } });
              }}
                className="btn-press flex-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center transition"
                style={{ background: '#FF7F27', boxShadow: '0 4px 14px rgba(255,127,39,0.35)' }}>
                BUY NOW →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2.5 shadow-xl md:hidden">
        <div className="max-w-md mx-auto flex items-center gap-2.5">
          {qty > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-2 py-1.5 flex-shrink-0">
              <button onClick={() => removeItem(cartKey)} className="btn-press w-7 h-7 flex items-center justify-center font-bold text-base text-gray-700">-</button>
              <span className="text-xs font-bold text-primary w-4 text-center">{qty}</span>
              <button onClick={() => addItem(cartKey)} className="btn-press w-7 h-7 flex items-center justify-center font-bold text-base text-gray-700">+</button>
            </div>
          )}

          <button disabled={!inStock} onClick={() => { if (inStock && qty === 0) addItem(cartKey); }}
            className="btn-press flex-1 py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition disabled:opacity-50 min-h-[44px]"
            style={{
              background: qty > 0 ? '#E7F5ED' : '#1A9E48',
              color: qty > 0 ? '#1A9E48' : '#fff',
              border: qty > 0 ? '2px solid #1A9E48' : 'none',
              boxShadow: qty > 0 ? 'none' : '0 2px 8px rgba(26,158,72,0.2)'
            }}>
            <ShoppingCart size={15} />
            <span className="truncate">{qty > 0 ? `${qty} in basket` : inStock ? 'Add to Basket' : 'Out of Stock'}</span>
          </button>

          {inStock && (
            <button onClick={() => {
              const buyNowData = { productId: cartKey, quantity: Math.max(1, qty || 1), product: { ...product, price, mrp, unit, stock } };
              try { sessionStorage.setItem('ushamart_buynow', JSON.stringify(buyNowData)); } catch(e){}
              navigate('/checkout', { state: { buyNow: buyNowData } });
            }}
              className="btn-press flex-1 py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center min-h-[44px] transition"
              style={{ background: '#FF7F27', boxShadow: '0 2px 8px rgba(255,127,39,0.25)' }}>
              BUY NOW →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
