import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Tag, X, ArrowLeft, Search, User } from 'lucide-react';
import { productsApi, couponsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/asset';
import { formatINR } from '../utils/currency';

export default function CartPage() {
  const { cart, addItem, removeItem, setQty, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponErr, setCouponErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getAll()
      .then(r => setProducts(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }))
    .filter(({ product }) => product);

  const subtotal = cartItems.reduce((s, { product, qty }) => s + product.price * qty, 0);
  const delivery = subtotal >= 299 || subtotal === 0 ? 0 : 40;
  
  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') discount = Math.min(subtotal, (subtotal * coupon.value) / 100);
    else if (coupon.type === 'flat') discount = Math.min(subtotal, coupon.value);
    else if (coupon.type === 'free_delivery') discount = delivery;
  }
  
  const deliveryFinal = coupon?.type === 'free_delivery' ? 0 : delivery;
  const total = Math.max(0, subtotal + deliveryFinal - (coupon?.type === 'free_delivery' ? 0 : discount));

  // Calculate total savings from item MRP difference + coupon discount
  const totalItemMrp = cartItems.reduce((s, { product: p, qty }) => s + (p.mrp || p.price) * qty, 0);
  const totalSavings = Math.max(0, totalItemMrp - subtotal) + discount;

  const applyCoupon = async () => {
    setCouponErr('');
    if (!couponCode.trim()) { setCouponErr('Enter a coupon code'); return; }
    try {
      const res = await couponsApi.validate(couponCode.trim().toUpperCase(), subtotal);
      setCoupon(res.data);
    } catch (e) { setCouponErr(e.message); }
  };

  const handleRemoveAll = () => {
    if (window.confirm('Remove all items from your cart?')) {
      clearCart();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );

  if (cartItems.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
      <ShoppingCart size={56} className="text-gray-200 mb-4" />
      <h2 className="text-base font-semibold text-gray-700">Your basket is empty</h2>
      <p className="text-sm text-gray-400 mt-1 mb-6">Add products to start shopping</p>
      <button onClick={() => navigate('/home')}
        className="btn-press px-6 py-3 rounded-2xl text-sm font-medium text-white"
        style={{ background: 'linear-gradient(135deg,#0B6F3A,#14a857)' }}>
        Start Shopping
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* 1. Header matching layout reference */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-150 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold text-gray-900">Cart</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/search')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition" aria-label="Search">
            <Search size={20} />
          </button>
          <button onClick={() => navigate('/cart')} className="relative p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition" aria-label="Cart">
            <ShoppingCart size={20} />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-yellow-400 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                {formatINR(total)}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/profile')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition" aria-label="Profile">
            <User size={20} />
          </button>
        </div>
      </div>

      {/* 2. Sub header matching layout reference */}
      <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center justify-between text-xs font-bold shadow-2xs">
        <span className="text-savings">Savings {formatINR(totalSavings)}</span>
        <span className="text-gray-900 font-bold">Cart Total {formatINR(total)}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Title */}
        <div className="pt-1">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">My Cart ({cartItems.length} item(s))</h2>
        </div>

        {/* Product items in clean mobile list layout */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-100">
          {cartItems.map(({ product: p, qty }) => {
            const itemSavings = (p.mrp > p.price) ? (p.mrp - p.price) * qty : 0;
            return (
              <div key={p.id} className="flex gap-4 p-4 items-start hover:bg-gray-50/40 transition">
                {/* LEFT: image container & delete button */}
                <div className="flex flex-col items-center gap-2.5 flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1.5 overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={resolveImageUrl(p.images[0])} alt={p.name} className="w-full h-full object-contain" onError={e => e.target.src = '/logo.png'} />
                    ) : (
                      <img src="/logo.png" alt={p.name} className="w-8 h-8 object-contain opacity-50" />
                    )}
                  </div>
                  <button onClick={() => setQty(p.id, 0)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition" title="Remove item">
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* CENTER: Name, unit, pay/save price info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-bold text-gray-900 leading-snug break-words">{p.name}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{p.unit || '1 Unit'}</p>
                  
                  <div className="mt-2 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-primary">You Pay {formatINR(p.price)}</span>
                      {p.mrp > p.price && (
                        <span className="text-[11px] text-gray-400 line-through">{formatINR(p.mrp)}</span>
                      )}
                    </div>
                    {itemSavings > 0 && (
                      <p className="text-[11px] font-bold text-savings">You Save {formatINR(itemSavings)}</p>
                    )}
                  </div>
                  
                  {/* Stock validation warning */}
                  {qty >= p.stock && (
                    <p className="text-[10px] text-red-500 font-bold mt-2 bg-red-50 px-2 py-0.5 rounded border border-red-100 w-fit">
                      Only {p.stock} available
                    </p>
                  )}
                </div>

                {/* RIGHT: Stepper control */}
                <div className="flex items-center border border-primary rounded-xl overflow-hidden bg-white flex-shrink-0">
                  <button 
                    onClick={() => {
                      if (qty === 1) {
                        if (window.confirm(`Remove ${p.name} from cart?`)) {
                          setQty(p.id, 0);
                        }
                      } else {
                        removeItem(p.id);
                      }
                    }} 
                    className="px-3.5 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm transition"
                  >
                    −
                  </button>
                  <span className="px-3.5 text-xs font-bold text-primary min-w-8 text-center">{qty}</span>
                  <button 
                    onClick={() => {
                      if (qty < p.stock) {
                        addItem(p.id);
                      }
                    }} 
                    disabled={qty >= p.stock}
                    className="px-3.5 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm transition disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Remove all trigger */}
        <div className="flex justify-start pt-1">
          <button 
            onClick={handleRemoveAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition"
          >
            <Trash2 size={14} /> Remove all
          </button>
        </div>

        {/* Coupon */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-medium text-gray-800 flex items-center gap-1.5 mb-3">
            <Tag size={13} className="text-primary" /> Promo Code
          </h3>
          {coupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
              <div>
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-lg mr-2">{coupon.code}</span>
                <span className="text-xs text-green-600 font-semibold">Applied!</span>
              </div>
              <button onClick={() => { setCoupon(null); setCouponCode(''); }} className="text-gray-400 hover:text-red-500 transition"><X size={14}/></button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponErr(''); }}
                  placeholder="ENTER COUPON CODE"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium uppercase focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white" />
                <button onClick={applyCoupon}
                  className="btn-press px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-xl transition">
                  Apply
                </button>
              </div>
              {couponErr && <p className="text-[11px] text-red-500 font-semibold">{couponErr}</p>}
            </div>
          )}
        </div>

        {/* Bill summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-medium text-gray-800 mb-3">Bill Summary</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Item Subtotal</span><span className="font-semibold text-gray-800">{formatINR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery</span>
              {deliveryFinal === 0 ? <span className="font-medium text-green-600">FREE</span> : <span className="font-semibold text-gray-800">{formatINR(deliveryFinal)}</span>}
            </div>
            {discount > 0 && coupon?.type !== 'free_delivery' && (
              <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span className="font-medium">-{formatINR(discount)}</span></div>
            )}
            {subtotal < 299 && subtotal > 0 && deliveryFinal > 0 && (
              <p className="text-[10px] text-primary font-semibold bg-primary/5 rounded-lg p-2 text-center">
                Add {formatINR(299 - subtotal)} more for FREE delivery!
              </p>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-semibold">
              <span>Grand Total</span><span className="text-primary">{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Proceed to Checkout Button */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => user ? navigate('/checkout') : navigate('/login')}
            className="btn-press w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition"
            style={{ background: '#FF7F27', boxShadow: '0 4px 14px rgba(255,127,39,0.35)' }}>
            <span>PROCEED TO CHECKOUT</span>
            <span className="flex items-center gap-1.5 font-bold">{formatINR(total)} <ArrowRight size={16}/></span>
          </button>
        </div>
      </div>
    </div>
  );
}
