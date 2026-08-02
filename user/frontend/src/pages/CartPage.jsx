import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Tag, X } from 'lucide-react';
import { productsApi, couponsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cart, addItem, removeItem, setQty, pincode } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products,  setProducts]  = useState([]);
  const [couponCode,setCouponCode]= useState('');
  const [coupon,    setCoupon]    = useState(null);
  const [couponErr, setCouponErr] = useState('');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    productsApi.getAll()
      .then(r => setProducts(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }))
    .filter(({ product }) => product);

  const subtotal  = cartItems.reduce((s, { product, qty }) => s + product.price * qty, 0);
  const delivery  = subtotal >= 299 || subtotal === 0 ? 0 : 40;
  let   discount  = 0;
  if (coupon) {
    if (coupon.type === 'percentage') discount = Math.min(subtotal, (subtotal * coupon.value) / 100);
    else if (coupon.type === 'flat')  discount = Math.min(subtotal, coupon.value);
    else if (coupon.type === 'free_delivery') discount = delivery;
  }
  const deliveryFinal = coupon?.type === 'free_delivery' ? 0 : delivery;
  const total = Math.max(0, subtotal + deliveryFinal - (coupon?.type === 'free_delivery' ? 0 : discount));

  const applyCoupon = async () => {
    setCouponErr('');
    if (!couponCode.trim()) { setCouponErr('Enter a coupon code'); return; }
    try {
      const res = await couponsApi.validate(couponCode.trim().toUpperCase(), subtotal);
      setCoupon(res.data);
    } catch (e) { setCouponErr(e.message); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
    </div>
  );

  if (cartItems.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
      <ShoppingCart size={56} className="text-gray-200 mb-4" />
      <h2 className="text-lg font-black text-gray-700">Your basket is empty</h2>
      <p className="text-sm text-gray-400 mt-1 mb-6">Add products to start shopping</p>
      <button onClick={() => navigate('/home')}
        className="btn-press px-6 py-3 rounded-2xl text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#0B6F3A,#14a857)' }}>
        Start Shopping
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-black text-gray-900">Your Basket</h1>
        <p className="text-xs text-gray-400">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-32 space-y-4">
        {/* Cart items */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {cartItems.map(({ product: p, qty }) => (
            <div key={p.id} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0">
              <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 p-1">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} className="max-w-full max-h-full object-contain"
                      onError={e => e.target.src = '/logo.png'} />
                  : <span className="text-2xl">🛒</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{p.unit} · ₹{p.price}</p>
              </div>
              {/* Stepper */}
              <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                <button onClick={() => removeItem(p.id)} className="btn-press px-2.5 py-1.5 text-sm font-black text-gray-700 hover:bg-gray-200">−</button>
                <span className="px-2.5 text-xs font-black text-gray-900">{qty}</span>
                <button onClick={() => addItem(p.id)} className="btn-press px-2.5 py-1.5 text-sm font-black text-gray-700 hover:bg-gray-200">+</button>
              </div>
              <div className="text-right flex-shrink-0 pl-1">
                <p className="text-xs font-black text-green-600">₹{(p.price * qty).toFixed(0)}</p>
              </div>
              <button onClick={() => setQty(p.id, 0)} className="btn-press ml-1 text-gray-300 hover:text-red-500 transition">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Tag size={13} className="text-primary" /> Promo Code
          </h3>
          {coupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
              <div>
                <span className="text-xs font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-lg mr-2">{coupon.code}</span>
                <span className="text-xs text-green-600 font-semibold">Applied!</span>
              </div>
              <button onClick={() => { setCoupon(null); setCouponCode(''); }} className="text-gray-400 hover:text-red-500 transition"><X size={14}/></button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponErr(''); }}
                  placeholder="ENTER COUPON CODE"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                <button onClick={applyCoupon}
                  className="btn-press px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition">
                  Apply
                </button>
              </div>
              {couponErr && <p className="text-[11px] text-red-500 font-semibold">{couponErr}</p>}
            </div>
          )}
        </div>

        {/* Bill summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3">Bill Summary</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Item Subtotal</span><span className="font-semibold text-gray-800">₹{subtotal.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery</span>
              {deliveryFinal === 0 ? <span className="font-bold text-green-600">FREE</span> : <span className="font-semibold text-gray-800">₹{deliveryFinal}</span>}
            </div>
            {discount > 0 && coupon?.type !== 'free_delivery' && (
              <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span className="font-bold">−₹{discount.toFixed(0)}</span></div>
            )}
            {subtotal < 299 && subtotal > 0 && deliveryFinal > 0 && (
              <p className="text-[10px] text-primary font-semibold bg-primary/5 rounded-lg p-2 text-center">
                Add ₹{(299 - subtotal).toFixed(0)} more for FREE delivery!
              </p>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-black">
              <span>Grand Total</span><span className="text-primary">₹{total.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Proceed button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => user ? navigate('/checkout') : navigate('/login')}
            className="btn-press w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg,#0B6F3A,#14a857)' }}>
            <span>Proceed to Checkout</span>
            <span className="flex items-center gap-1.5 font-black">₹{total.toFixed(0)} <ArrowRight size={16}/></span>
          </button>
        </div>
      </div>
    </div>
  );
}
