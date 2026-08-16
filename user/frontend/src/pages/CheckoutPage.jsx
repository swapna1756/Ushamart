import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Home, Loader2, MapPin, PackageCheck, ShieldCheck, Trash2, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { addressesApi, authApi, ordersApi, pincodesApi, productsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../utils/asset';
import { formatINR } from '../utils/currency';

const emptyAddress = {
  fullName: '',
  mobileNumber: '',
  house: '',
  street: '',
  landmark: '',
  state: '',
  district: '',
  pincode: '',
  deliveryInstructions: ''
};

function money(n) {
  return formatINR(n);
}

function cleanPhone(v) {
  return String(v || '').replace(/\D/g, '').slice(-10);
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { cart, pincode: defaultPincode, clearCart } = useCart();

  // 1. Read Buy Now payload
  const buyNowInfo = useMemo(() => {
    if (location.state?.buyNow) {
      return location.state.buyNow;
    }
    try {
      const stored = sessionStorage.getItem('ushamart_buynow');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  }, [location.state]);

  const isBuyNow = Boolean(buyNowInfo?.productId);

  // States
  const [products, setProducts] = useState([]);
  const [singleBuyNowProduct, setSingleBuyNowProduct] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ ...emptyAddress });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [payment, setPayment] = useState('COD');
  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [addressServiceable, setAddressServiceable] = useState(true);
  const [pincodeConfig, setPincodeConfig] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);

  // Derived selected address (DECLARED HERE BEFORE USEEFFECT TO AVOID TDZ CRASH)
  const selectedAddress = useMemo(() => {
    return addresses.find(a => a.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  // Sync address form default fields when user/profile loads
  useEffect(() => {
    if (profile || user) {
      setAddressForm(prev => ({
        ...prev,
        fullName: prev.fullName || profile?.full_name || user?.displayName || '',
        mobileNumber: prev.mobileNumber || profile?.mobile_number || '',
        pincode: prev.pincode || defaultPincode || profile?.pincode || '',
        district: prev.district || profile?.city || '',
        state: prev.state || profile?.state || '',
        street: prev.street || profile?.default_address || '',
      }));
    }
  }, [profile, user, defaultPincode]);

  // Load checkout details
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true, state: { returnTo: location.pathname } });
      return;
    }

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        await ensureBackendToken();

        const [prodRes, addrRes] = await Promise.all([
          productsApi.getAll().catch(() => ({ data: [] })),
          addressesApi.getAll().catch(() => ({ data: [] }))
        ]);

        const fetchedProducts = prodRes.data || [];
        setProducts(fetchedProducts);

        if (buyNowInfo?.productId) {
          if (buyNowInfo.product) {
            setSingleBuyNowProduct(buyNowInfo.product);
          } else {
            const foundInAll = fetchedProducts.find(p => p.id === buyNowInfo.productId);
            if (!foundInAll) {
              try {
                const singleRes = await productsApi.getById(buyNowInfo.productId);
                if (singleRes?.data) setSingleBuyNowProduct(singleRes.data);
              } catch (e) {
                console.error("Failed to fetch buyNow product", e);
              }
            }
          }
        }

        const rows = addrRes.data || [];
        setAddresses(rows);
        if (rows.length > 0) {
          setSelectedAddressId(rows[0].id);
        } else {
          setShowAddForm(true);
        }
      } catch (e) {
        setError(e.message || 'Unable to load checkout details.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Verify pincode availability whenever the selected address changes
  useEffect(() => {
    if (!selectedAddress?.pincode) {
      setAddressServiceable(true);
      setPincodeConfig(null);
      return;
    }
    pincodesApi.check(selectedAddress.pincode)
      .then(res => {
        if (res.serviceable || res.success) {
          setAddressServiceable(true);
          setPincodeConfig(res.data || null);
        } else {
          setAddressServiceable(false);
          setPincodeConfig(null);
        }
      })
      .catch(() => {
        setAddressServiceable(true);
        setPincodeConfig(null);
      });
  }, [selectedAddress]);

  async function ensureBackendToken() {
    const existing = localStorage.getItem('ushamart_user_token');
    if (existing && existing !== 'undefined' && existing !== 'null') return existing;
    if (!user) {
      navigate('/login', { replace: true, state: { returnTo: location.pathname } });
      return null;
    }
    try {
      const idToken = await user.getIdToken().catch(() => 'mock_token_' + user.uid);
      const res = await authApi.firebaseLogin({
        idToken,
        name: profile?.full_name || user.displayName || 'Customer',
        phone: profile?.mobile_number || user.phoneNumber || '9999999999'
      }).catch(async () => {
        return await authApi.login({
          phone: profile?.mobile_number || '9999999999',
          name: profile?.full_name || user.displayName || 'Customer',
          email: user.email || ''
        });
      });
      if (res?.token) {
        localStorage.setItem('ushamart_user_token', res.token);
        return res.token;
      }
    } catch (e) {
      console.warn("Backend auth token creation skipped/failed", e);
    }
    return null;
  }

  // Derive requested items
  const requestedMap = useMemo(() => {
    if (isBuyNow && buyNowInfo?.productId) {
      return { [buyNowInfo.productId]: Math.max(1, Number(buyNowInfo.quantity) || 1) };
    }
    return cart;
  }, [isBuyNow, buyNowInfo, cart]);

  const items = useMemo(() => {
    return Object.entries(requestedMap)
      .map(([id, qty]) => {
        const [prodId, variantUnit] = id.split('::');
        let p = products.find(p => p.id === prodId);
        if (!p && singleBuyNowProduct && (singleBuyNowProduct.id === id || singleBuyNowProduct.id === prodId)) {
          p = singleBuyNowProduct;
        }
        if (!p) return null;
        
        let price = p.price;
        let mrp = p.mrp || p.price;
        let unit = p.unit;
        let stock = p.stock;
        
        if (variantUnit) {
          const variant = (p.variantList || []).find(v => v.unit === variantUnit);
          if (variant) {
            price = variant.price;
            mrp = variant.mrp || variant.price;
            unit = variant.unit;
            stock = variant.stock;
          }
        }
        
        const variantProduct = {
          ...p,
          id, // keep the full key for item key mappings
          baseProductId: prodId,
          price,
          mrp,
          unit,
          stock,
          variantUnit
        };
        return { product: variantProduct, qty };
      })
      .filter(x => Boolean(x.product));
  }, [requestedMap, products, singleBuyNowProduct]);

  // Pricing calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, { product, qty }) => sum + (Number(product.price) || 0) * qty, 0);
  }, [items]);

  const totalMrp = useMemo(() => {
    return items.reduce((sum, { product, qty }) => sum + (Number(product.mrp || product.price) || 0) * qty, 0);
  }, [items]);

  const discount = Math.max(0, totalMrp - subtotal);
  const deliveryCharges = subtotal >= 299 ? 0 : 40;
  const totalAmount = subtotal + deliveryCharges;

  // Address validation
  async function validateAddressFields(a) {
    const next = { ...a, mobileNumber: cleanPhone(a.mobileNumber), pincode: String(a.pincode || '').trim() };
    if (!next.fullName) return 'Full Name is required.';
    if (!next.mobileNumber) return 'Mobile Number is required.';
    if (!/^[6-9]\d{9}$/.test(next.mobileNumber)) return 'Please enter a valid 10-digit Indian mobile number.';
    if (!next.house) return 'House / Flat / Building is required.';
    if (!next.street) return 'Street / Area is required.';
    if (!next.state) return 'State is required.';
    if (!next.district) return 'District / City is required.';
    if (!next.pincode) return 'Pincode is required.';
    if (!/^[1-9][0-9]{5}$/.test(next.pincode)) return 'Please enter a valid Indian 6-digit pincode.';

    try {
      const pinCheck = await pincodesApi.check(next.pincode);
      if (pinCheck && pinCheck.serviceable === false) {
        return 'Delivery is currently not available for this pincode.';
      }
    } catch (e) {
      console.warn("Pincode service check failed", e);
    }
    return '';
  }

  async function saveAddress() {
    setError('');
    setPincodeError('');
    const validationMsg = await validateAddressFields(addressForm);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setSavingAddress(true);
    try {
      await ensureBackendToken();
      const payload = {
        ...addressForm,
        mobileNumber: cleanPhone(addressForm.mobileNumber),
        pincode: String(addressForm.pincode).trim()
      };
      const res = await addressesApi.create(payload);
      const savedDoc = res.data;
      setAddresses(prev => [savedDoc, ...prev]);
      setSelectedAddressId(savedDoc.id);
      setShowAddForm(false);
      setAddressForm({ ...emptyAddress });
    } catch (e) {
      setError(e.message || 'Unable to save address.');
    } finally {
      setSavingAddress(false);
    }
  }

  // Order Placement
  async function placeOrder() {
    setError('');
    if (!selectedAddress) {
      setError('Please select or add a delivery address.');
      return;
    }
    if (!selectedSlot) {
      setError('Please select a delivery slot.');
      return;
    }
    if (payment !== 'COD') {
      setError('Only Cash on Delivery is available at this time.');
      return;
    }

    // Verify pincode serviceability
    try {
      const pinCheck = await pincodesApi.check(selectedAddress.pincode);
      if (pinCheck && pinCheck.serviceable === false) {
        setError('Delivery is not available at this pincode.');
        return;
      }
    } catch (e) {
      console.warn("Pincode check failed during placeOrder", e);
    }

    if (placing) return;
    setPlacing(true);

    try {
      await ensureBackendToken();
      const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const res = await ordersApi.create({
        idempotencyKey,
        addressId: selectedAddress.id,
        address: selectedAddress,
        items: items.map(({ product, qty }) => ({
          productId: product.id,
          quantity: qty,
          variantInfo: product.unit || product.variants || ''
        })),
        paymentMethod: 'COD',
        deliverySlot: selectedSlot
      });

      if (isBuyNow) {
        try { sessionStorage.removeItem('ushamart_buynow'); } catch (e) {}
      } else {
        clearCart();
      }

      setSuccessOrder(res.data);
      setPlacing(false);
    } catch (e) {
      setError(e.message || 'Unable to place order. Please try again.');
      setPlacing(false);
    }
  }

  const deliverySlots = [
    { id: 'today_evening', label: 'Today • 6 PM – 8 PM' },
    { id: 'tomorrow_morning', label: 'Tomorrow • 10 AM – 1 PM' },
    { id: 'tomorrow_afternoon', label: 'Tomorrow • 2 PM – 5 PM' },
    { id: 'tomorrow_evening', label: 'Tomorrow • 6 PM – 8 PM' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary spin" />
          <p className="text-sm font-medium text-gray-600">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-gray-800">Your Checkout is Empty</h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">Select a product to Buy Now or add items to your basket to proceed.</p>
          <button onClick={() => navigate('/home')} className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition">
            Explore Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-150 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-press w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">Checkout</h1>
            <p className="text-xs text-gray-500">Single Page Order Summary</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_380px] gap-6">
        <main className="space-y-6 min-w-0">
          {/* SECTION 1: DELIVERY ADDRESS */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={17} className="text-primary" /> 1. DELIVERY ADDRESS
              </h2>
              {!showAddForm && (
                <button onClick={() => setShowAddForm(true)} className="text-xs font-semibold text-primary hover:text-primary-dark">
                  + Add New Address
                </button>
              )}
            </div>

            {/* List existing addresses */}
            {!showAddForm && addresses.length > 0 && (
              <div className="grid gap-3">
                {addresses.map(a => (
                  <div key={a.id} onClick={() => setSelectedAddressId(a.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition text-xs space-y-1.5 ${selectedAddressId === a.id ? 'border-primary bg-green-50/20' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>{a.fullName}</span>
                      {selectedAddressId === a.id && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">Selected</span>}
                    </div>
                    <p className="text-gray-600 leading-relaxed">{a.house}, {a.street}, {a.district}, {a.state} - <span className="font-bold">{a.pincode}</span></p>
                    <p className="text-gray-500 font-medium">📞 {a.mobileNumber}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add address form */}
            {showAddForm && (
              <div className="bg-gray-50/50 rounded-xl border border-gray-150 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-800">Add New Delivery Address</span>
                  {addresses.length > 0 && (
                    <button onClick={() => setShowAddForm(false)} className="text-xs font-medium text-gray-400 hover:text-gray-600">Cancel</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <label className="font-semibold text-gray-700 block mb-1">Full Name *</label>
                    <input type="text" value={addressForm.fullName} onChange={e => setAddressForm(p => ({ ...p, fullName: e.target.value }))} placeholder="e.g. Rahul Sharma" className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Phone Number *</label>
                    <input type="tel" maxLength={10} value={addressForm.mobileNumber} onChange={e => setAddressForm(p => ({ ...p, mobileNumber: cleanPhone(e.target.value) }))} placeholder="10 Digits" className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Pincode *</label>
                    <input type="text" maxLength={6} value={addressForm.pincode} onChange={e => setAddressForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="6 Digits" className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">House/Flat/Building *</label>
                    <input type="text" value={addressForm.house} onChange={e => setAddressForm(p => ({ ...p, house: e.target.value }))} placeholder="Flat/House No" className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Area/Street *</label>
                    <input type="text" value={addressForm.street} onChange={e => setAddressForm(p => ({ ...p, street: e.target.value }))} placeholder="Area, Landmark" className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">City *</label>
                    <input type="text" value={addressForm.district} onChange={e => setAddressForm(p => ({ ...p, district: e.target.value }))} placeholder="City Name" className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">State *</label>
                    <input type="text" value={addressForm.state} onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))} placeholder="State Name" className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white" />
                  </div>
                </div>
                <button onClick={saveAddress} disabled={savingAddress} className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold transition shadow-xs">
                  {savingAddress ? 'Saving Address...' : 'Save & Select Address'}
                </button>
              </div>
            )}
          </section>

          {/* SECTION 2: DELIVERY AVAILABILITY */}
          {selectedAddress && (
            <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <PackageCheck size={17} className="text-primary" /> 2. DELIVERY AVAILABILITY
              </h2>
              <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs ${addressServiceable ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-red-50/50 border-red-200 text-red-700'}`}>
                {addressServiceable ? (
                  <div>
                    <p className="font-bold text-green-700 flex items-center gap-1">✓ Delivery available</p>
                    <p className="text-[11px] text-green-600 mt-1">We deliver to {selectedAddress.district || selectedAddress.city} - {selectedAddress.pincode}</p>
                    {pincodeConfig && (
                      <p className="text-[11px] text-gray-500 mt-1.5 font-medium">Estimated Delivery: {pincodeConfig.deliveryTime || '1-2 Days'}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-red-600">✕ Delivery unavailable</p>
                    <p className="text-[11px] text-red-500 mt-1">We don't currently deliver to pincode {selectedAddress.pincode}. Please pick or add another location.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SECTION 3: DELIVERY SLOT */}
          {selectedAddress && addressServiceable && (
            <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <ShieldCheck size={17} className="text-primary" /> 3. DELIVERY SLOT
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {deliverySlots.map(s => (
                  <div key={s.id} onClick={() => setSelectedSlot(s.label)} className={`p-3 rounded-xl border-2 cursor-pointer transition font-medium text-center ${selectedSlot === s.label ? 'border-primary bg-green-50/20 text-primary font-bold' : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'}`}>
                    {s.label}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 5: PAYMENT METHOD */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <CreditCard size={17} className="text-primary" /> 4. PAYMENT METHOD
            </h2>
            <div className="space-y-2.5 text-xs">
              {/* Cash on Delivery */}
              <div onClick={() => setPayment('COD')} className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${payment === 'COD' ? 'border-primary bg-green-50/20' : 'border-gray-200'}`}>
                <span className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center bg-primary text-white flex-shrink-0 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-white" /></span>
                <div>
                  <p className="font-bold text-gray-900">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Pay with cash when your items are delivered.</p>
                </div>
              </div>
              {/* Card Payment (Disabled) */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 opacity-60 flex items-start gap-3 cursor-not-allowed">
                <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between font-bold text-gray-500">
                    <span>Credit / Debit Card</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Coming Soon</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Pay securely online using your card.</p>
                </div>
              </div>
              {/* UPI Payment (Disabled) */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 opacity-60 flex items-start gap-3 cursor-not-allowed">
                <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between font-bold text-gray-500">
                    <span>UPI / Google Pay / PhonePe</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Coming Soon</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Instantly pay using your preferred UPI app.</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Right Sidebar: ORDER SUMMARY & PLACE ORDER */}
        <aside className="space-y-6">
          {/* SECTION 4: ORDER SUMMARY */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">5. ORDER SUMMARY</h2>
            
            {/* Items list */}
            <div className="divide-y divide-gray-150 max-h-60 overflow-y-auto space-y-3 pr-1">
              {items.map(({ product: p, qty }) => (
                <div key={p.id} className="flex gap-3 py-2 first:pt-0 last:pb-0 items-center text-xs">
                  <div className="w-10 h-10 rounded-lg border border-gray-100 flex-shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center p-1">
                    {p.images?.[0] ? (
                      <img src={resolveImageUrl(p.images[0])} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <img src="/logo.png" className="w-6 h-6 object-contain opacity-55" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{p.unit} × {qty}</p>
                  </div>
                  <span className="font-bold text-gray-800 flex-shrink-0">{money(p.price * qty)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-semibold text-gray-800">{money(subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery Fee</span>
                {deliveryCharges === 0 ? <span className="font-bold text-green-600">FREE</span> : <span className="font-semibold text-gray-800">{money(deliveryCharges)}</span>}
              </div>
              {discount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Discount</span><span>-{money(discount)}</span></div>}
              <div className="border-t border-gray-150 pt-2 flex justify-between font-bold text-sm text-gray-905"><span>Total</span><span className="text-primary text-base">{money(totalAmount)}</span></div>
            </div>
          </section>

          {/* SECTION 6: PLACE ORDER BUTTON */}
          <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-xs font-semibold">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button onClick={placeOrder} disabled={placing || !selectedAddress || !addressServiceable || !selectedSlot || items.length === 0} className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-2" style={{ background: '#FF7F27', boxShadow: '0 4px 14px rgba(255,127,39,0.35)' }}>
              {placing ? (
                <>
                  <Loader2 className="w-4 h-4 spin" />
                  PLACING ORDER...
                </>
              ) : (
                `PLACE ORDER — ${money(totalAmount)}`
              )}
            </button>
          </section>
        </aside>
      </div>

      {successOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 text-center animate-pop">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Order Placed Successfully!</h3>
              <p className="text-xs text-gray-500">Your order has been placed successfully.</p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 text-left text-xs space-y-3">
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-400 font-medium">Order ID</span>
                <span className="font-bold text-gray-900 font-mono">{successOrder.orderNumber || successOrder.id}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-400 font-medium">Payment</span>
                <span className="font-bold text-gray-950">Cash on Delivery</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-400 font-medium">Total</span>
                <span className="font-bold text-primary">{money(successOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Delivery</span>
                <span className="font-bold text-gray-950">{successOrder.deliverySlot || 'Anytime'}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => navigate(`/orders/${successOrder.id}`)}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition uppercase tracking-wider font-semibold"
              >
                TRACK ORDER
              </button>
              <button 
                onClick={() => navigate('/home')}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition uppercase tracking-wider font-semibold"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
