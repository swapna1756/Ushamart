import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { productsApi, ordersApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const SLOTS = ['Tomorrow, 7AM–10AM','Tomorrow, 10AM–1PM','Tomorrow, 1PM–4PM',
  'Tomorrow, 4PM–7PM','Day After, 8AM–11AM','Day After, 3PM–6PM'];

export default function CheckoutPage() {
  const { cart, pincode, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [products, setProducts] = useState([]);
  const [slot,     setSlot]     = useState('');
  const [method,   setMethod]   = useState('COD');
  const [placing,  setPlacing]  = useState(false);
  const [error,    setError]    = useState('');
  const [name,     setName]     = useState(user?.name  || '');
  const [phone,    setPhone]    = useState(user?.phone || '');
  const [address,  setAddress]  = useState(user?.addressText || '');

  useEffect(() => {
    productsApi.getAll()
      .then(r => setProducts(r.data || []))
      .catch(console.error);
  }, []);

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }))
    .filter(({ product }) => product);

  const subtotal = cartItems.reduce((s, { product, qty }) => s + product.price * qty, 0);
  const delivery = subtotal >= 299 ? 0 : 40;
  const total    = subtotal + delivery;

  const handlePlace = async () => {
    setError('');
    if (!slot)    { setError('Please select a delivery slot.'); return; }
    if (!name || !phone) { setError('Please enter your name and phone.'); return; }
    if (!address) { setError('Please enter your delivery address.'); return; }

    setPlacing(true);
    try {
      const items = cartItems.map(({ product: p, qty }) => ({
        productId: p.id, name: p.name, quantity: qty,
        price: p.price, mrp: p.mrp || p.price,
        unit: p.unit || '', image: p.images?.[0] || '',
      }));
      const res = await ordersApi.create({
        items, pincode,
        address: { name, phone, addressText: address },
        summary: { itemTotal: subtotal, deliveryFee: delivery, couponDiscount: 0, grandTotal: total },
        deliverySlot: slot, paymentMethod: method,
      });
      clearCart();
      navigate(`/orders/${res.data.id}`, { replace: true });
    } catch (e) { setError(e.message || 'Order failed. Please try again.'); }
    finally { setPlacing(false); }
  };

  if (cartItems.length === 0) {
    navigate('/cart', { replace: true }); return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-press w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-sm font-black text-gray-900">Confirm Order</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-40 space-y-4">
        {/* Delivery Address */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <MapPin size={13} className="text-primary" /> Delivery Address
          </h3>
          <div className="space-y-2.5">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name *"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone *"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
            <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address *" rows={2}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"/>
            {pincode && <p className="text-[10px] text-gray-400">Pincode: <span className="font-bold">{pincode}</span></p>}
          </div>
        </div>

        {/* Delivery Slot */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Calendar size={13} className="text-primary" /> Delivery Slot
          </h3>
          <div className="flex flex-wrap gap-2">
            {SLOTS.map(s => (
              <button key={s} onClick={() => setSlot(s)}
                className={`btn-press px-3 py-2 rounded-xl border text-[11px] font-bold transition ${
                  slot === s ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <CreditCard size={13} className="text-primary" /> Payment Method
          </h3>
          <div className="space-y-2">
            {[{id:'COD',label:'Cash on Delivery',enabled:true},{id:'UPI',label:'UPI (Coming Soon)',enabled:false},{id:'Card',label:'Card (Coming Soon)',enabled:false}].map(pm => (
              <div key={pm.id} onClick={() => pm.enabled && setMethod(pm.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition ${pm.enabled ? method === pm.id ? 'border-primary bg-primary/5' : 'border-gray-200 cursor-pointer hover:border-gray-300' : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}`}>
                <input type="radio" checked={method === pm.id} onChange={() => pm.enabled && setMethod(pm.id)} disabled={!pm.enabled} className="accent-primary w-4 h-4"/>
                <span className="text-xs font-bold text-gray-800 flex-1">{pm.label}</span>
                {!pm.enabled && <span className="text-[9px] font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Soon</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3">Order Summary</h3>
          {cartItems.map(({ product: p, qty }) => (
            <div key={p.id} className="flex items-center gap-2 mb-2 last:mb-0">
              <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain p-0.5" />}
              </div>
              <div className="flex-1 min-w-0"><p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                <p className="text-[10px] text-gray-400">Qty: {qty} × ₹{p.price}</p></div>
              <span className="text-xs font-black text-green-600">₹{(p.price*qty).toFixed(0)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{subtotal.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery</span>{delivery===0?<span className="font-bold text-green-600">FREE</span>:<span className="font-semibold">₹{delivery}</span>}</div>
            <div className="flex justify-between text-sm font-black border-t border-gray-100 pt-2"><span>Total</span><span className="text-primary">₹{total.toFixed(0)}</span></div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs font-semibold text-red-600">⚠️ {error}</div>}
      </div>

      {/* Place order */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 shadow-lg"
        style={{ paddingBottom:'env(safe-area-inset-bottom)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={handlePlace} disabled={placing}
            className="btn-press w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-lg"
            style={{ background:'linear-gradient(135deg,#0B6F3A,#14a857)' }}>
            <span>{placing ? 'Placing Order…' : 'Place Order'}</span>
            <span className="flex items-center gap-1.5">{placing && <Loader2 size={15} className="spin"/>}₹{total.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
