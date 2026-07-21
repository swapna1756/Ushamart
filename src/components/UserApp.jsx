import React, { useState, useEffect } from 'react';
import {
  MapPin, Search, ChevronRight, ShoppingBag, Home, Grid, ClipboardList,
  User, ArrowLeft, Plus, Minus, Check, SlidersHorizontal, X,
  ShoppingCart, Loader2, Phone, Lock, Calendar, CreditCard, Sparkles, LogOut,
  Bell, Heart, Clock, Navigation, ChevronDown
} from 'lucide-react';
import { db, auth } from '../db/mockFirebase';

// UshaMart Brand Logo matching the corporate identity
export function UshaMartLogo({ className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center p-1 bg-white ${className}`}>
      <img src="/logo.png" alt="Usha Mart Wholesale" className="max-w-full h-auto object-contain" />
    </div>
  );
}

export function getCategoryImage(catName, catIcon) {
  if (catIcon && typeof catIcon === 'string' && catIcon.trim() !== '' && !catIcon.includes('loremflickr.com')) {
    return catIcon;
  }
  const name = (catName || '').toLowerCase().trim();
  if (name.includes('dairy') || name.includes('egg')) {
    return '/cat_dairy.png';
  }
  if (name.includes('fruit') || name.includes('veg')) {
    return '/cat_fruits_veg.png';
  }
  if (name.includes('tea') || name.includes('coffee')) {
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&q=80';
  }
  if (name.includes('biscuit') || name.includes('cookie')) {
    return 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=120&q=80';
  }
  if (name.includes('beverage') || name.includes('drink') || name.includes('cola') || name.includes('soda')) {
    return '/prod_juice.png';
  }
  if (name.includes('cleaner') || name.includes('soap')) {
    return 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=120&q=80';
  }
  if (name.includes('bath') || name.includes('body') || name.includes('shampoo')) {
    return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=120&q=80';
  }
  if (name.includes('ready') || name.includes('cook') || name.includes('noodle') || name.includes('food')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&q=80';
  }
  if (name.includes('detergent') || name.includes('staple')) {
    return 'https://images.unsplash.com/photo-1610557892470-76d747e2db51?w=120&q=80';
  }
  if (name.includes('snack') || name.includes('munch') || name.includes('chip') || name.includes('popcorn')) {
    return '/prod_chips.png';
  }
  return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&q=80';
}

export function getProductImage(prodName, prodImages) {
  if (prodImages && prodImages.length > 0 && prodImages[0] && !prodImages[0].includes('loremflickr.com')) {
    return prodImages[0];
  }
  const name = (prodName || '').toLowerCase().trim();
  if (name.includes('apple')) {
    return '/prod_apples.png';
  }
  if (name.includes('chip') || name.includes('snack')) {
    return '/prod_chips.png';
  }
  if (name.includes('juice') || name.includes('beverage') || name.includes('drink')) {
    return '/prod_juice.png';
  }
  if (name.includes('milk') || name.includes('dairy') || name.includes('cheese') || name.includes('butter')) {
    return 'https://images.unsplash.com/photo-1596662951913-90924bcebd83?w=150&q=80';
  }
  if (name.includes('bread')) {
    return 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=150&q=80';
  }
  return '/logo.png';
}

export default function UserApp({ user, setUser }) {
  // App Navigation & Gates
  const [activeTab, setActiveTab] = useState('home'); // home, categories, cart, orders, profile, tracking
  const [pincode, setPincode] = useState(() => localStorage.getItem('ushamart_active_pincode') || '560001');
  const [tempPincode, setTempPincode] = useState('');
  const [showSplash, setShowSplash] = useState(true);

  // Pincode change modal
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeModalError, setPincodeModalError] = useState('');

  // Pincode Config & Coupon states
  const [pincodeConfigs, setPincodeConfigs] = useState([]);
  const [activePincodeConfig, setActivePincodeConfig] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');

  // Product Details Modal
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  // Customer Support Simulator
  const [supportMessage, setSupportMessage] = useState('');
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportType, setSupportType] = useState('Delivery Issue');
  const [supportSuccessMsg, setSupportSuccessMsg] = useState('');

  // Rating Modal
  const [rateOrder, setRateOrder] = useState(null);
  const [ratingsForm, setRatingsForm] = useState({}); // { [productId]: ratingValue }
  const [ratingSubmittedOrders, setRatingSubmittedOrders] = useState(() => {
    try {
      const stored = localStorage.getItem('ushamart_rated_orders');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Support Message reply text
  const [supportReplyText, setSupportReplyText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Database Synchronized States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [serviceablePincodes, setServiceablePincodes] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // App UI & Cart States
  const [cart, setCart] = useState({});  // always start empty — populated after products load
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortOption, setSortOption] = useState('default'); // default, low-high, high-low, savings
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: '',
    phone: '',
    addressText: ''
  });
  const [tempAddress, setTempAddress] = useState({
    name: '',
    phone: '',
    addressText: ''
  });

  const [mapCoords, setMapCoords] = useState({ lat: 12.9716, lon: 77.5946 });

  // Fetch coordinates from OpenStreetMap Nominatim API based on search queries
  const geocodeAddress = async (queryStr) => {
    if (!queryStr) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr + ', India')}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCoords({ lat, lon });
      }
    } catch (e) {
      console.warn("OpenStreetMap geocoding failed: ", e);
    }
  };

  // Debounce query coordinate resolution when typing full street addresses
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (tempAddress.addressText.trim().length > 6) {
        geocodeAddress(tempAddress.addressText);
      }
    }, 1500);
    return () => clearTimeout(delayDebounce);
  }, [tempAddress.addressText]);

  // Geocode location coordinates when a 6-digit pincode is completed
  useEffect(() => {
    if (tempPincode.length === 6) {
      geocodeAddress(tempPincode);
    }
  }, [tempPincode]);

  // Checkout Specifics
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  // Auth Gate
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authStep, setAuthStep] = useState(1); // 1 = Phone Input, 2 = OTP Input
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Carousel Index
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Header category chip quick-filter
  const [activeChip, setActiveChip] = useState('All');

  const publishedCategories = categories.filter(c => c.status === 'published');

  // Auto-login user to bypass registration/login screens
  useEffect(() => {
    if (!user) {
      const defaultUser = {
        uid: 'u1',
        name: 'Alok Kumar',
        phone: '9876543210',
        email: 'alok@gmail.com',
        addressText: 'Flat 405, Green Glen Layout, Bangalore - 560103',
        needProfileUpdate: false,
        status: 'active',
        role: 'customer'
      };
      localStorage.setItem('ushamart_user', JSON.stringify(defaultUser));
      setUser(defaultUser);
      // Sync auto-login user into the users collection so admin can see them
      const syncUser = async () => {
        try {
          const existingUsers = await db.collection('users').get();
          const found = existingUsers.find(u => u.phone === defaultUser.phone);
          const now = Date.now();
          if (found) {
            await db.collection('users').update(found.id, { lastLogin: now });
          } else {
            await db.collection('users').add({
              ...defaultUser,
              registeredAt: now,
              lastLogin: now,
              pincode: localStorage.getItem('ushamart_active_pincode') || '',
              totalOrders: 0,
              totalSpent: 0,
            });
          }
        } catch (e) {
          console.warn('User sync skipped:', e);
        }
      };
      syncUser();
      window.dispatchEvent(new Event('ushamart_auth_change'));
    }
  }, [user, setUser]);

  // Subscribe to real-time collections
  useEffect(() => {
    const unsubProducts = db.collection('products').onSnapshot((data) => {
      setProducts(data);
    });
    const unsubCategories = db.collection('categories').onSnapshot((data) => {
      setCategories(data);
      const published = data.filter(c => c.status === 'published');
      if (published.length > 0) {
        setSelectedCategory(prev => {
          if (!prev || !published.some(c => c.id === prev)) {
            return published[0].id;
          }
          return prev;
        });
      }
    });
    const unsubBanners = db.collection('banners').onSnapshot((data) => {
      setBanners(data);
    });
    const unsubPincodes = db.collection('pincodes').onSnapshot((data) => {
      setServiceablePincodes(data);
    });
    const unsubConfigs = db.collection('pincode_configs').onSnapshot((data) => {
      setPincodeConfigs(data);
    });
    const unsubCoupons = db.collection('coupons').onSnapshot((data) => {
      setCoupons(data);
    });
    const unsubSupport = db.collection('support_tickets').onSnapshot((data) => {
      setSupportTickets(data);
    });
    const unsubNotif = db.collection('notifications').onSnapshot((data) => {
      setNotifications(data);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubPincodes();
      unsubConfigs();
      unsubCoupons();
      unsubSupport();
      unsubNotif();
    };
  }, []);

  // Update active region settings
  useEffect(() => {
    if (pincode) {
      const conf = pincodeConfigs.find(c => c.code === pincode);
      if (conf) {
        setActivePincodeConfig(conf);
      } else {
        setActivePincodeConfig({ code: pincode, charges: 1.99, time: '1-2 Days' });
      }
    } else {
      setActivePincodeConfig(null);
    }
  }, [pincode, pincodeConfigs]);

  // Keep delivery address values in sync with logged in user profile
  useEffect(() => {
    if (user && !user.needProfileUpdate && !deliveryAddress.name) {
      const loadedAddress = {
        name: user.name || '',
        phone: user.phone || '',
        addressText: user.addressText || ''
      };
      setDeliveryAddress(loadedAddress);
      setTempAddress(loadedAddress);
    }
  }, [user]);

  // Update user orders in real-time when logged in
  useEffect(() => {
    if (!user) {
      setUserOrders([]);
      return;
    }
    const unsubOrders = db.collection('orders').onSnapshot((data) => {
      const filtered = data
        .filter(order => order.address.phone === user.phone)
        .sort((a, b) => b.createdAt - a.createdAt);
      setUserOrders(filtered);
    });
    return () => unsubOrders();
  }, [user]);

  // Persist Cart to localStorage whenever it changes
  useEffect(() => {
    if (pincode) {
      localStorage.setItem(`ushamart_cart_${pincode}`, JSON.stringify(cart));
    }
  }, [cart, pincode]);

  // Load cart from localStorage once products are available — strips stale/orphaned product IDs
  useEffect(() => {
    if (products.length === 0 || !pincode) return;
    try {
      const stored = localStorage.getItem(`ushamart_cart_${pincode}`);
      if (!stored) { setCart({}); return; }
      const parsed = JSON.parse(stored);
      const productIds = new Set(products.map(p => p.id));
      // Only keep items that exist in the current product catalog
      const clean = Object.fromEntries(
        Object.entries(parsed).filter(([id, qty]) => productIds.has(id) && qty > 0)
      );
      setCart(clean);
    } catch {
      setCart({});
    }
  }, [products]); // runs once products load; pincode change handled by persist effect

  // Auto Scroll Promotional Carousel Banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  // Helper Cart Computations
  const getCartItemsCount = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      // Only count if the product actually exists in the catalog
      return products.find(p => p.id === id) ? sum + qty : sum;
    }, 0);
  };

  const getCartTotals = () => {
    let itemTotal = 0;
    let originalTotal = 0;

    Object.entries(cart).forEach(([id, qty]) => {
      const prod = products.find(p => p.id === id);
      if (prod) {
        itemTotal += prod.price * qty;
        originalTotal += (prod.mrp || prod.price) * qty;
      }
    });

    const deliveryFeeBase = activePincodeConfig ? activePincodeConfig.charges : 1.99;
    const isFreeDeliveryApplied = appliedCoupon && appliedCoupon.type === 'free_delivery';
    const deliveryFee = (itemTotal >= 30 || itemTotal === 0 || isFreeDeliveryApplied) ? 0 : deliveryFeeBase;

    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        couponDiscount = (itemTotal * appliedCoupon.value) / 100;
      } else if (appliedCoupon.type === 'flat') {
        couponDiscount = appliedCoupon.value;
      }
      couponDiscount = Math.min(itemTotal, couponDiscount);
    }

    const savings = (originalTotal - itemTotal) + couponDiscount;
    const grandTotal = Math.max(0, itemTotal + deliveryFee - couponDiscount);

    return {
      itemTotal: parseFloat(itemTotal.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      couponDiscount: parseFloat(couponDiscount.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  const updateCartQty = (productId, change) => {
    setCart(prev => {
      const newCart = { ...prev };
      const currentQty = newCart[productId] || 0;
      const targetProduct = products.find(p => p.id === productId);

      if (!targetProduct) return prev;

      const newQty = currentQty + change;
      if (newQty <= 0) {
        delete newCart[productId];
      } else {
        // Enforce stock boundaries
        if (newQty > targetProduct.stock) {
          alert(`Only ${targetProduct.stock} items left in stock.`);
          return prev;
        }
        newCart[productId] = newQty;
      }
      return newCart;
    });
  };

  // Check pincode serviceability
  const handlePincodeSubmit = (e) => {
    e?.preventDefault();
    setShowNotifySuccess(false);
    const cleanPin = (tempPincode || '').trim();
    if (!cleanPin) {
      setPincodeError('Please enter a valid pincode.');
      return;
    }

    const config = pincodeConfigs.find(c => c.code === cleanPin);
    if (config && config.enabled) {
      setPincode(cleanPin);
      localStorage.setItem('ushamart_active_pincode', cleanPin);
      setPincodeError('');
      geocodeAddress(cleanPin);
      setDeliveryAddress(prev => ({
        ...prev,
        addressText: prev.addressText ? prev.addressText.replace(/\b\d{6}\b/, cleanPin) : ''
      }));
    } else {
      setPincodeError('Delivery is not available in the entered pincode location. Please enter a valid pincode.');
      geocodeAddress(cleanPin);
    }
  };

  // Request Service Notification
  const handleRequestNotification = async () => {
    try {
      const payload = {
        phoneNumber: authPhone || user?.phone || 'Guest',
        userName: user?.name || 'Guest User',
        requestedPincode: tempPincode,
        requestedTime: Date.now()
      };
      await db.collection('service_requests').add(payload);
      setShowNotifySuccess(true);
    } catch (e) {
      console.error("Failed to request service notification: ", e);
    }
  };

  // Apply Coupon
  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    setCouponError('');
    if (!couponCodeInput.trim()) {
      setCouponError('Enter a coupon code.');
      return;
    }
    const totals = getCartTotals();
    const cleanCode = couponCodeInput.trim().toUpperCase();
    const couponMatch = coupons.find(c => c.code === cleanCode && c.status === 'published');

    if (!couponMatch) {
      setCouponError('Invalid or expired coupon code.');
      return;
    }

    if (totals.itemTotal < couponMatch.minSpend) {
      setCouponError(`Min order of ₹${couponMatch.minSpend} required for this coupon.`);
      return;
    }

    setAppliedCoupon(couponMatch);
    setCouponError('');
  };

  // Real location detection using Geolocation API and Nominatim
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setPincodeError('');
    setShowNotifySuccess(false);

    if (!navigator.geolocation) {
      setPincodeError('Geolocation is not supported by your browser.');
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setMapCoords({ lat: latitude, lon: longitude });

          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();

          if (data && data.address && data.address.postcode) {
            const fetchedPincode = data.address.postcode;
            setTempPincode(fetchedPincode);

            setDeliveryAddress(prev => ({
              ...prev,
              name: prev.name || '',
              phone: prev.phone || '',
              addressText: data.display_name || ''
            }));
            setTempAddress(prev => ({
              ...prev,
              name: prev.name || '',
              phone: prev.phone || '',
              addressText: data.display_name || ''
            }));
          } else {
            setPincodeError('Could not auto-detect your pincode. Please input manually.');
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          setPincodeError('Failed to fetch location details.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setPincodeError(
          error.code === error.PERMISSION_DENIED
            ? 'Location access denied. Please allow location or enter manually.'
            : 'Failed to access your location.'
        );
        setIsDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  // Filtered Products Query (Published & matching Pincode)
  const getFilteredProducts = () => {
    return products.filter(p => {
      const isPublished = p.status === 'published';
      // If pincodesAvailable is empty/missing → show everywhere; otherwise check match
      const isServiceable = !p.pincodesAvailable || p.pincodesAvailable.length === 0
        ? true
        : p.pincodesAvailable.includes(pincode);
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.department || '').toLowerCase().includes(q);
      return isPublished && isServiceable && matchesSearch;
    });
  };

  // Sort & Filter Logic for Product List Pane
  const getSortedProducts = (prodList) => {
    const list = [...prodList];
    if (sortOption === 'low-high') {
      return list.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'high-low') {
      return list.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'savings') {
      return list.sort((a, b) => {
        const discountA = (a.mrp - a.price) / (a.mrp || 1);
        const discountB = (b.mrp - b.price) / (b.mrp || 1);
        return discountB - discountA;
      });
    }
    return list;
  };

  // Recommended Products Query (Published & matching Pincode)
  const getRecommendedProducts = () => {
    const list = products.filter(p => {
      if (p.status !== 'published') return false;
      if (!p.pincodesAvailable || p.pincodesAvailable.length === 0) return true;
      return p.pincodesAvailable.includes(pincode);
    });
    return list.slice().reverse().slice(0, 4);
  };

  // Popular Products Query (Published & matching Pincode)
  const getPopularProducts = () => {
    const list = products.filter(p => {
      if (p.status !== 'published') return false;
      if (!p.pincodesAvailable || p.pincodesAvailable.length === 0) return true;
      return p.pincodesAvailable.includes(pincode);
    });
    return list.slice().sort((a, b) => a.stock - b.stock).slice(0, 4);
  };

  // Recently Purchased Products Query (based on user orders history)
  const getRecentlyPurchasedProducts = () => {
    if (!user || userOrders.length === 0) return [];
    const purchasedIds = new Set();
    userOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(item => {
          purchasedIds.add(item.productId);
        });
      }
    });
    return products.filter(p => {
      if (p.status !== 'published' || !purchasedIds.has(p.id)) return false;
      if (!p.pincodesAvailable || p.pincodesAvailable.length === 0) return true;
      return p.pincodesAvailable.includes(pincode);
    });
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    try {
      const newTicket = {
        phone: user?.phone || 'Guest',
        type: supportType,
        message: supportMessage.trim(),
        status: 'Open',
        createdAt: Date.now()
      };
      await db.collection('support_tickets').add(newTicket);
      setSupportMessage('');
      setSupportSuccessMsg('Support request submitted! We will respond shortly.');
      setTimeout(() => setSupportSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to submit ticket');
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!rateOrder) return;
    try {
      const orderRateData = {
        orderId: rateOrder.id,
        phone: user?.phone || 'Guest',
        ratings: { ...ratingsForm },
        createdAt: Date.now()
      };
      await db.collection('ratings').add(orderRateData);

      const newRatedList = [...ratingSubmittedOrders, rateOrder.id];
      setRatingSubmittedOrders(newRatedList);
      localStorage.setItem('ushamart_rated_orders', JSON.stringify(newRatedList));

      setRateOrder(null);
      setRatingsForm({});
      alert('Thank you for rating your order!');
    } catch (err) {
      alert('Failed to submit ratings.');
    }
  };

  // Customer Phone OTP Auth Login with administrative checking (blocked state checks)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (authStep === 1) {
      if (!authPhone || authPhone.length < 10) {
        setAuthError('Please enter a valid phone number');
        return;
      }
      setIsAuthLoading(true);
      setTimeout(() => {
        setIsAuthLoading(false);
        setAuthStep(2); // Move to OTP input
      }, 1000);
    } else {
      if (!authOtp || authOtp.length !== 4) {
        setAuthError('Please enter the 4-digit OTP (e.g. 1234)');
        return;
      }
      setIsAuthLoading(true);
      try {
        // Query users table checklist to check if phone is blocked
        const usersList = await db.collection('users').get();
        const matchedDbUser = usersList.find(u => u.phone === authPhone);

        if (matchedDbUser && matchedDbUser.status === 'blocked') {
          setAuthError('Your customer account is blocked by UshaMart Admin.');
          setIsAuthLoading(false);
          return;
        }

        const userObj = await auth.signInWithPhone(authPhone);
        const now = Date.now();

        if (matchedDbUser) {
          const fullUserObj = { ...userObj, ...matchedDbUser };
          localStorage.setItem('ushamart_user', JSON.stringify(fullUserObj));
          setUser(fullUserObj);
          // Update lastLogin timestamp in users collection
          await db.collection('users').update(matchedDbUser.id, {
            lastLogin: now,
            pincode: localStorage.getItem('ushamart_active_pincode') || matchedDbUser.pincode || '',
          });
          setProfileName(matchedDbUser.name || '');
          setProfileEmail(matchedDbUser.email || '');
          setProfileAddress(matchedDbUser.addressText || '');
        } else {
          // New User signup flow — write to users collection immediately
          const newDbUser = {
            ...userObj,
            name: '',
            email: '',
            addressText: '',
            status: 'active',
            role: 'customer',
            registeredAt: now,
            lastLogin: now,
            pincode: localStorage.getItem('ushamart_active_pincode') || '',
            totalOrders: 0,
            totalSpent: 0,
          };
          await db.collection('users').add(newDbUser);
          const incompleteUser = { ...newDbUser, needProfileUpdate: true };
          localStorage.setItem('ushamart_user', JSON.stringify(incompleteUser));
          setUser(incompleteUser);

          setProfileName('');
          setProfileEmail('');
          setProfileAddress(deliveryAddress.addressText || '');
        }

        setIsAuthModalOpen(false);
        setAuthPhone('');
        setAuthOtp('');
        setAuthStep(1);
      } catch (err) {
        setAuthError(err.message || 'OTP validation failed.');
      } finally {
        setIsAuthLoading(false);
      }
    }
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedSlot) {
      alert('Please select a delivery slot.');
      return;
    }

    const totals = getCartTotals();
    const orderItems = Object.entries(cart).map(([prodId, qty]) => {
      const prod = products.find(p => p.id === prodId);
      return {
        productId: prodId,
        quantity: qty,
        price: prod.price,
        name: prod.name,
        image: getProductImage(prod.name, prod.images)
      };
    });

    const newOrder = {
      pincode: pincode,
      items: orderItems,
      summary: totals,
      deliverySlot: selectedSlot,
      address: deliveryAddress,
      paymentMethod: paymentMethod,
      status: 'Placed',
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      createdAt: Date.now()
    };

    try {
      const created = await db.collection('orders').add(newOrder);
      // Reduce product stock in mock db
      for (const item of orderItems) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          await db.collection('products').update(prod.id, {
            stock: Math.max(0, prod.stock - item.quantity)
          });
        }
      }

      // Reset cart and coupon
      setCart({});
      setAppliedCoupon(null);
      setCouponCodeInput('');
      setSelectedSlot('');
      setTrackingOrderId(created.id);
      setActiveTab('tracking');
    } catch (e) {
      console.error(e);
      alert('Order placement failed. Check console.');
    }
  };

  // Splash Loading Screen
  if (showSplash) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white px-8 text-center animate-fade-in select-none">
        <div className="space-y-8 flex flex-col items-center justify-center">
          {/* Cart loading image */}
          <div className="w-36 h-36 flex items-center justify-center animate-pulse bg-white p-2 rounded-2xl border">
            <img src="/logo.png" alt="Loading UshaMart" className="max-w-full max-h-full object-contain" />
          </div>

          {/* Rotating spinner and tag */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#0B6F3A]/20 border-t-[#0B6F3A] rounded-full animate-spin"></div>
            <p className="text-[10px] text-text-medium font-black uppercase tracking-widest">
              LOADING CATALOG...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ONBOARDING 1: Register / Login screen
  // ONBOARDING 1: Register / Login screen (Bypassed)
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white select-none">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  // Active Filtered list matching selected category
  const getCategoryProducts = () => {
    // Filter ONLY by published + pincode + category — ignore searchQuery when browsing categories
    const prods = products.filter(p => {
      if (p.status !== 'published') return false;
      if (p.category !== selectedCategory) return false;
      // Pincode check: empty array = available everywhere
      if (!p.pincodesAvailable || p.pincodesAvailable.length === 0) return true;
      return p.pincodesAvailable.includes(pincode);
    });
    return getSortedProducts(prods);
  };

  // ── Premium Product Card ──
  const ProductCard = ({ product }) => {
    const qty = cart[product.id] || 0;
    const discountPercent = product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
    const discountAmount = product.mrp > product.price ? product.mrp - product.price : 0;

    const variantList = product.variants
      ? product.variants.split(',').map(v => v.trim()).filter(Boolean)
      : [];
    const [selectedVariant, setSelectedVariant] = useState(
      product.unit || (variantList.length > 0 ? variantList[0] : '')
    );

    // Deterministic mock star rating seeded by product id
    const starRating = product.id
      ? (3.5 + ((product.id.charCodeAt(product.id.length - 1) % 15) / 10))
      : 4.2;
    const displayRating = Math.min(5, parseFloat(starRating.toFixed(1)));

    return (
      <div
        className="bg-white flex flex-col relative overflow-hidden card-hover animate-fade-in"
        style={{
          borderRadius: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {/* Discount badge — top-left */}
        {discountPercent > 0 && (
          <div
            className="absolute top-2 left-2 z-10 discount-badge"
            style={{
              background: 'linear-gradient(135deg, #EE4224, #ff6b35)',
              color: '#fff',
              fontSize: '9px',
              fontWeight: '800',
              padding: '2px 7px',
              borderRadius: '8px',
              letterSpacing: '0.02em',
              boxShadow: '0 2px 6px rgba(238,66,36,0.4)',
            }}
          >
            {discountPercent}% OFF
          </div>
        )}

        {/* Out-of-stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-2xl">
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#999', background: '#f5f5f5', padding: '3px 10px', borderRadius: '8px', border: '1px solid #ddd' }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* Image zone — with zoom on hover */}
        <div
          onClick={() => setSelectedProductDetails(product)}
          className="cursor-pointer img-zoom flex items-center justify-center bg-gray-50"
          style={{ height: '108px', borderRadius: '16px 16px 0 0', padding: '12px' }}
        >
          <img
            src={getProductImage(product.name, product.images)}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
            style={{ maxHeight: '84px' }}
            onError={e => { e.target.src = '/logo.png'; }}
          />
        </div>

        {/* Info zone */}
        <div className="flex flex-col flex-1 px-2.5 pb-2.5 pt-2">
          {/* Brand tag */}
          {product.brand && (
            <span style={{ fontSize: '8.5px', fontWeight: '600', color: '#888', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '2px' }}>
              {product.brand}
            </span>
          )}

          {/* Product name */}
          <p
            onClick={() => setSelectedProductDetails(product)}
            className="cursor-pointer line-clamp-2 leading-snug"
            style={{ fontSize: '12px', fontWeight: '700', color: '#1a1a1a', marginBottom: '3px', lineHeight: '1.35' }}
          >
            {product.name}
          </p>

          {/* Unit / variant row */}
          <div className="mb-2" onClick={e => e.stopPropagation()}>
            {variantList.length > 1 ? (
              <div className="flex flex-wrap gap-1">
                {variantList.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    style={{
                      padding: '1px 6px',
                      fontSize: '8px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: selectedVariant === v ? '1.5px solid #0B6F3A' : '1px solid #ddd',
                      background: selectedVariant === v ? '#E7F5ED' : '#fff',
                      color: selectedVariant === v ? '#0B6F3A' : '#999',
                      transition: 'all 0.15s',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '10px', color: '#aaa', fontWeight: '500' }}>
                {product.unit || selectedVariant || ''}
              </span>
            )}
          </div>

          {/* Rating row */}
          <div className="flex items-center gap-1 mb-2">
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5"
              style={{ background: '#f0faf4', borderRadius: '6px', border: '1px solid #c8ecd6' }}
            >
              <span style={{ color: '#f59e0b', fontSize: '9px', lineHeight: 1 }}>★</span>
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#1B5E20' }}>{displayRating}</span>
            </div>
            <span style={{ fontSize: '9px', color: '#bbb', fontWeight: '500' }}>
              ({Math.floor(40 + (product.stock || 0) % 60)})
            </span>
          </div>

          {/* Price row */}
          <div className="flex items-baseline gap-1.5 mb-2 mt-auto">
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1a1a1a' }}>₹{product.price}</span>
            {product.mrp > product.price && (
              <span style={{ fontSize: '10px', color: '#bbb', textDecoration: 'line-through', fontWeight: '500' }}>
                ₹{product.mrp}
              </span>
            )}
            {discountAmount > 0 && (
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#0B6F3A' }}>
                Save ₹{discountAmount}
              </span>
            )}
          </div>

          {/* Add to cart / stepper */}
          {qty > 0 ? (
            <div
              className="flex items-center justify-between overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0B6F3A, #14a857)',
                borderRadius: '10px',
                boxShadow: '0 3px 10px rgba(11,111,58,0.35)',
              }}
            >
              <button
                onClick={() => updateCartQty(product.id, -1)}
                className="btn-press flex items-center justify-center"
                style={{ width: '32px', height: '32px', color: '#fff' }}
              >
                <Minus size={12} strokeWidth={3} />
              </button>
              <span style={{ color: '#fff', fontWeight: '800', fontSize: '13px', minWidth: '20px', textAlign: 'center' }}>
                {qty}
              </span>
              <button
                onClick={() => updateCartQty(product.id, 1)}
                className="btn-press flex items-center justify-center"
                style={{ width: '32px', height: '32px', color: '#fff' }}
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => product.stock > 0 && updateCartQty(product.id, 1)}
              disabled={product.stock === 0}
              className="btn-press w-full flex items-center justify-center gap-1"
              style={{
                height: '32px',
                borderRadius: '10px',
                border: product.stock === 0 ? '1.5px solid #ddd' : '1.5px solid #0B6F3A',
                background: product.stock === 0 ? '#f5f5f5' : '#fff',
                color: product.stock === 0 ? '#bbb' : '#0B6F3A',
                fontSize: '12px',
                fontWeight: '700',
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { if (product.stock > 0) { e.currentTarget.style.background = '#0B6F3A'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { if (product.stock > 0) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0B6F3A'; } }}
            >
              <Plus size={12} strokeWidth={3} />
              Add
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-bg-light relative font-sans">

      {/* ── Premium Green Header ── */}
      <div
        className="z-20 flex-shrink-0"
        style={{
          background: 'linear-gradient(160deg, #2E7D32 0%, #388E3C 40%, #43A047 75%, #4CAF50 100%)',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
          boxShadow: '0 8px 32px -4px rgba(46,125,50,0.45), 0 2px 8px rgba(0,0,0,0.12)',
          paddingBottom: '6px'
        }}
      >
        {/* ── Row 1: Logo · Notification · Wishlist · Cart ── */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          {/* Logo */}
          <div className="flex-shrink-0 select-none">
            <div
              className="bg-white/15 backdrop-blur-sm rounded-xl px-2 py-1 border border-white/25"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            >
              <img src="/logo.png" alt="Usha Mart" className="h-7 w-auto object-contain" />
            </div>
          </div>

          {/* Right icon group */}
          <div className="flex items-center gap-1.5">
            {/* Notification */}
            <button
              onClick={() => setActiveTab('profile')}
              className="relative w-8 h-8 rounded-full flex items-center justify-center btn-press"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(6px)' }}
              aria-label="Notifications"
            >
              <Bell size={15} className="text-white" strokeWidth={2} />
              {notifications.length > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                  style={{ background: '#EE4224', boxShadow: '0 2px 6px rgba(238,66,36,0.6)' }}
                >
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Wishlist */}
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center btn-press"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(6px)' }}
              aria-label="Wishlist"
            >
              <Heart size={15} className="text-white" strokeWidth={2} />
            </button>

            {/* Cart */}
            <button
              onClick={() => setActiveTab('cart')}
              className="relative w-8 h-8 rounded-full flex items-center justify-center btn-press"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(6px)' }}
              aria-label="Cart"
            >
              <ShoppingCart size={15} className="text-white" strokeWidth={2} />
              {getCartItemsCount() > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                  style={{ background: '#EE4224', boxShadow: '0 2px 6px rgba(238,66,36,0.6)' }}
                >
                  {getCartItemsCount() > 9 ? '9+' : getCartItemsCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Row 2: Search Bar ── */}
        <div className="px-3 pt-1 pb-1 relative">
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '22px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid rgba(255,255,255,0.8)'
            }}
          >
            <Search size={16} className="text-green-700 flex-shrink-0" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search for groceries, fruits, vegetables..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'home') setActiveTab('home');
              }}
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-[12px] font-semibold focus:outline-none"
              style={{ minWidth: 0 }}
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 btn-press"
                aria-label="Clear search"
              >
                <X size={10} className="text-gray-600" strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Row 3: Location + Delivery Time ── */}
        <div className="px-3 pt-1 pb-2 flex items-center justify-between gap-2">
          {/* Location */}
          <button
            onClick={() => { setPincodeInput(pincode); setPincodeModalError(''); setShowPincodeModal(true); }}
            className="flex items-center gap-1.5 flex-1 min-w-0 btn-press"
            aria-label="Change delivery location"
          >
            <MapPin size={13} className="text-yellow-300 flex-shrink-0" strokeWidth={2.5} />
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-0.5">
                <span className="text-white text-[10px] font-black leading-none">Deliver to</span>
                <ChevronDown size={11} className="text-white/80" strokeWidth={2.5} />
              </div>
              <p className="text-white/80 text-[9.5px] font-semibold truncate leading-tight mt-0.5">
                {deliveryAddress.addressText
                  ? deliveryAddress.addressText.split(',').slice(0, 2).join(',')
                  : `Pincode: ${pincode}`}
              </p>
            </div>
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-white/25 flex-shrink-0" />

          {/* Delivery time */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock size={12} className="text-yellow-300" strokeWidth={2.5} />
            <div className="text-right">
              <span className="text-white text-[9px] font-black block leading-none">Earliest Delivery</span>
              <span className="text-white/80 text-[9px] font-semibold block leading-tight mt-0.5">
                {activePincodeConfig?.time || '30–45 mins'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Row 4: Category Chips ── */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-3 pt-0.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* "All" chip */}
          {['All', ...publishedCategories.map(c => c.name)].map((chipLabel, idx) => {
            const isActive = activeChip === chipLabel;
            const catObj = publishedCategories.find(c => c.name === chipLabel);
            return (
              <button
                key={chipLabel}
                onClick={() => {
                  setActiveChip(chipLabel);
                  if (chipLabel === 'All') {
                    setSearchQuery('');
                    setActiveTab('home');
                  } else if (catObj) {
                    setSelectedCategory(catObj.id);
                    setActiveTab('categories');
                  }
                }}
                className="flex-shrink-0 flex items-center gap-1.5 btn-press"
                style={{
                  background: isActive
                    ? 'rgba(255,255,255,1)'
                    : 'rgba(255,255,255,0.15)',
                  border: isActive
                    ? '1.5px solid rgba(255,255,255,0.9)'
                    : '1.5px solid rgba(255,255,255,0.35)',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  backdropFilter: 'blur(4px)',
                  boxShadow: isActive
                    ? '0 2px 10px rgba(0,0,0,0.15)'
                    : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {catObj && (
                  <img
                    src={getCategoryImage(catObj.name, catObj.icon)}
                    alt={catObj.name}
                    className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.01em',
                    color: isActive ? '#1B5E20' : 'rgba(255,255,255,0.95)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {chipLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen Views Wrapper */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">

        {/* SCREEN 2: Home Screen */}
        {activeTab === 'home' && (
          <div className="pb-2" style={{ background: '#f5f7f5' }}>

            {/* ── Hero / Promo Banner ── */}
            <div className="px-3 pt-3 pb-1">
              {banners.length === 0 ? (
                <div className="relative overflow-hidden animate-fade-in" style={{ background: 'linear-gradient(135deg,#1B5E20 0%,#2E7D32 35%,#388E3C 65%,#43A047 100%)', borderRadius: '20px', minHeight: '140px', boxShadow: '0 8px 28px rgba(27,94,32,0.35)' }}>
                  <div style={{ position:'absolute', top:'-24px', right:'-24px', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
                  <div style={{ position:'absolute', bottom:'-32px', left:'-20px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
                  <div className="flex items-center justify-between h-full p-4">
                    <div className="flex-1 pr-3">
                      <div className="inline-block mb-2" style={{ background:'rgba(255,255,255,0.18)', borderRadius:'20px', padding:'3px 10px', border:'1px solid rgba(255,255,255,0.25)' }}>
                        <span style={{ color:'#fff', fontSize:'9px', fontWeight:'700', letterSpacing:'0.06em', textTransform:'uppercase' }}>🚀 Express Delivery</span>
                      </div>
                      <h2 style={{ color:'#fff', fontSize:'17px', fontWeight:'800', lineHeight:'1.25', marginBottom:'6px', textShadow:'0 1px 4px rgba(0,0,0,0.2)' }}>Fresh Groceries<br />Delivered in Minutes</h2>
                      <p style={{ color:'rgba(255,255,255,0.82)', fontSize:'10.5px', fontWeight:'500', marginBottom:'10px', lineHeight:'1.4' }}>Farm-fresh produce &amp; daily essentials at your door</p>
                      <button onClick={() => setActiveTab('categories')} className="btn-press" style={{ background:'#fff', color:'#1B5E20', fontSize:'11px', fontWeight:'800', padding:'7px 18px', borderRadius:'22px', border:'none', boxShadow:'0 4px 14px rgba(0,0,0,0.18)' }}>Shop Now →</button>
                    </div>
                    <div className="flex-shrink-0 img-zoom" style={{ width:'108px', height:'108px', borderRadius:'16px', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.25)', border:'2px solid rgba(255,255,255,0.2)' }}>
                      <img src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80" alt="Fresh groceries" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden animate-fade-in" style={{ borderRadius:'20px', boxShadow:'0 6px 24px rgba(0,0,0,0.15)' }}>
                  <img src={banners[carouselIndex].imageUrl} alt={banners[carouselIndex].title} className="w-full object-cover" style={{ height:'140px' }} />
                  <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background:'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 60%)' }}>
                    <span className="w-max mb-1" style={{ background:'#EE4224', color:'#fff', fontSize:'8px', fontWeight:'800', padding:'2px 8px', borderRadius:'10px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{banners[carouselIndex].badgeText || 'OFFER'}</span>
                    <h3 style={{ color:'#fff', fontSize:'13px', fontWeight:'800', lineHeight:'1.3' }} className="line-clamp-1">{banners[carouselIndex].title}</h3>
                  </div>
                  <div className="absolute bottom-2 right-3 flex gap-1">
                    {banners.map((_, idx) => (
                      <span key={idx} style={{ width: idx===carouselIndex?'14px':'5px', height:'5px', borderRadius:'3px', background: idx===carouselIndex?'#fff':'rgba(255,255,255,0.4)', transition:'all 0.3s ease', display:'inline-block' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Today's Best Deals ── */}
            <div className="pt-4 pb-1">
              <div className="flex items-center justify-between px-3 mb-3">
                <div>
                  <h2 style={{ fontSize:'15px', fontWeight:'800', color:'#1a1a1a', lineHeight:'1.2' }}>Today's Best Deals</h2>
                  <p style={{ fontSize:'10px', color:'#888', fontWeight:'500', marginTop:'1px' }}>Limited time — grab before they're gone!</p>
                </div>
                <button onClick={() => setActiveTab('categories')} className="btn-press flex items-center gap-0.5" style={{ color:'#0B6F3A', fontSize:'11px', fontWeight:'700' }}>
                  See all <ChevronRight size={13} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-3 pb-1" style={{ WebkitOverflowScrolling:'touch' }}>
                {[
                  { label:'Fruits & Veggies', badge:'UP TO 40% OFF', color:'#E8F5E9', accent:'#2E7D32', img:'/cat_fruits_veg.png', query:'fruits' },
                  { label:'Dairy & Eggs', badge:'SAVE ₹30', color:'#FFF8E1', accent:'#F57F17', img:'/cat_dairy.png', query:'dairy' },
                  { label:'Cold Beverages', badge:'20% OFF', color:'#E3F2FD', accent:'#1565C0', img:'/prod_juice.png', query:'juice' },
                  { label:'Snacks & Munchies', badge:'BUY 2 GET 1', color:'#FCE4EC', accent:'#C62828', img:'/prod_chips.png', query:'chips' },
                ].map((deal) => (
                  <button key={deal.label} onClick={() => { setSearchQuery(deal.query); setActiveTab('categories'); }} className="flex-shrink-0 btn-press text-left" style={{ width:'140px', background:deal.color, borderRadius:'16px', padding:'12px', border:`1px solid ${deal.accent}22`, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
                    <div style={{ background:deal.accent, color:'#fff', fontSize:'8px', fontWeight:'800', padding:'2px 7px', borderRadius:'8px', display:'inline-block', marginBottom:'8px', letterSpacing:'0.04em' }}>{deal.badge}</div>
                    <div className="img-zoom" style={{ width:'64px', height:'64px', margin:'0 auto 8px', borderRadius:'12px', overflow:'hidden', background:'rgba(255,255,255,0.7)' }}>
                      <img src={deal.img} alt={deal.label} className="w-full h-full object-cover" />
                    </div>
                    <p style={{ fontSize:'11px', fontWeight:'700', color:'#1a1a1a', lineHeight:'1.3' }}>{deal.label}</p>
                    <p style={{ fontSize:'9.5px', color:deal.accent, fontWeight:'600', marginTop:'2px' }}>Shop Now →</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Free Delivery promo strip ── */}
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-center justify-between px-4 py-3 animate-fade-in" style={{ background:'linear-gradient(135deg,#0B6F3A 0%,#14a857 100%)', borderRadius:'14px', boxShadow:'0 4px 16px rgba(11,111,58,0.3)' }}>
                <div>
                  <p style={{ color:'#fff', fontSize:'12px', fontWeight:'800', lineHeight:'1.2' }}>🎉 Free Delivery</p>
                  <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'9.5px', fontWeight:'500', marginTop:'2px' }}>On orders above ₹30 · Use <strong style={{ color:'#fff' }}>WELCOME20</strong> for 20% off</p>
                </div>
                <button onClick={() => setActiveTab('cart')} className="btn-press flex-shrink-0" style={{ background:'#fff', color:'#0B6F3A', fontSize:'10px', fontWeight:'800', padding:'6px 14px', borderRadius:'20px', border:'none', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>Claim</button>
              </div>
            </div>

            {/* ── Fruits & Vegetables quick-shop grid ── */}
            <div className="px-3 pt-4 pb-1">
              <div style={{ background:'#FFFBF0', borderRadius:'18px', border:'1px solid #FDE68A', padding:'14px', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ fontSize:'13px', fontWeight:'800', color:'#78350F' }}>🥬 Fruits &amp; Vegetables</h3>
                  <button onClick={() => { const c = publishedCategories.find(cat => cat.name.toLowerCase().includes('fruit')); if (c) { setSelectedCategory(c.id); setActiveTab('categories'); } }} style={{ fontSize:'10px', fontWeight:'700', color:'#92400E' }}>See all →</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name:'Fresh Fruits', img:'/cat_fruits_veg.png', sub:'Mangoes, Apples…', query:'apple' },
                    { name:'Leafy Greens', img:'https://images.unsplash.com/photo-1547514701-42782101795e?w=120&q=80', sub:'Spinach, Coriander…', query:'vegetables' },
                    { name:'Exotics & Cuts', img:'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=120&q=80', sub:'Dragon fruit, Kiwi…', query:'exotics' },
                    { name:'Herbs & Spices', img:'https://images.unsplash.com/photo-1596790011462-c39c6f1a23b1?w=120&q=80', sub:'Mint, Turmeric…', query:'herbs' },
                  ].map((item) => (
                    <button key={item.name} onClick={() => { setSearchQuery(item.query); setActiveTab('categories'); }} className="flex items-center gap-2.5 btn-press text-left" style={{ background:'#fff', borderRadius:'12px', padding:'9px 10px', border:'1px solid #FDE68A', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'10px', overflow:'hidden', flexShrink:0 }}>
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p style={{ fontSize:'10.5px', fontWeight:'700', color:'#1a1a1a', lineHeight:'1.2' }}>{item.name}</p>
                        <p style={{ fontSize:'8.5px', color:'#999', marginTop:'1px' }}>{item.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Seasonal promo banner ── */}
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-center justify-between overflow-hidden animate-fade-in" style={{ background:'linear-gradient(135deg,#0D47A1 0%,#1565C0 50%,#1976D2 100%)', borderRadius:'16px', padding:'14px 16px', boxShadow:'0 4px 18px rgba(13,71,161,0.3)' }}>
                <div>
                  <span style={{ background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:'8px', fontWeight:'700', padding:'2px 8px', borderRadius:'8px', textTransform:'uppercase', letterSpacing:'0.06em', display:'inline-block', marginBottom:'6px' }}>Back to School</span>
                  <h4 style={{ color:'#fff', fontSize:'12px', fontWeight:'800', lineHeight:'1.25' }}>School Essentials Ready!</h4>
                  <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'9.5px', marginTop:'3px' }}>Notebooks, stationery &amp; snacks</p>
                </div>
                <div style={{ width:'60px', height:'60px', borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(255,255,255,0.3)', flexShrink:0, boxShadow:'0 4px 12px rgba(0,0,0,0.2)' }}>
                  <img src="https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=120&q=80" alt="School" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* ── Category-grouped product sections ── */}
            {(() => {
              const allPublished = getFilteredProducts();
              if (allPublished.length === 0) {
                return (
                  <div className="px-3 pt-4 pb-4">
                    <div className="flex flex-col items-center justify-center text-center py-10" style={{ background:'#fff', borderRadius:'18px', border:'1.5px dashed #e0e0e0', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                      <ShoppingCart size={32} className="mb-3" style={{ color:'#ddd' }} />
                      <p style={{ fontSize:'12px', fontWeight:'700', color:'#888' }}>No products available right now</p>
                      <p style={{ fontSize:'10px', color:'#bbb', marginTop:'4px' }}>Check back soon or try a different pincode.</p>
                    </div>
                  </div>
                );
              }

              const grouped = publishedCategories
                .map(cat => ({ cat, prods: allPublished.filter(p => p.category === cat.id) }))
                .filter(g => g.prods.length > 0);

              const categorisedIds = new Set(grouped.flatMap(g => g.prods.map(p => p.id)));
              const uncategorised = allPublished.filter(p => !categorisedIds.has(p.id));
              if (uncategorised.length > 0) grouped.push({ cat: { id:'other', name:'Other Products', icon:'' }, prods: uncategorised });

              const accentPalette = [
                { bg:'#F1F8E9', border:'#C5E1A5', text:'#33691E' },
                { bg:'#FFF8E1', border:'#FFE082', text:'#E65100' },
                { bg:'#E3F2FD', border:'#90CAF9', text:'#0D47A1' },
                { bg:'#FCE4EC', border:'#F48FB1', text:'#880E4F' },
                { bg:'#EDE7F6', border:'#B39DDB', text:'#4527A0' },
              ];

              return grouped.map(({ cat, prods }, groupIdx) => {
                const accent = accentPalette[groupIdx % accentPalette.length];
                return (
                  <div key={cat.id} className="px-3 pt-4 pb-1 animate-fade-in">
                    <div className="flex items-center justify-between mb-3 px-3 py-2" style={{ background:accent.bg, borderRadius:'12px', border:`1px solid ${accent.border}` }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width:'28px', height:'28px', borderRadius:'8px', overflow:'hidden', border:`1px solid ${accent.border}`, flexShrink:0, background:'#fff' }}>
                          <img src={getCategoryImage(cat.name, cat.icon)} alt={cat.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 style={{ fontSize:'13px', fontWeight:'800', color:'#1a1a1a', lineHeight:'1.2' }}>{cat.name}</h3>
                          <p style={{ fontSize:'9px', color:'#888', fontWeight:'500', marginTop:'1px' }}>{prods.length} item{prods.length !== 1 ? 's' : ''} available</p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedCategory(cat.id); setActiveTab('categories'); }} className="btn-press flex items-center gap-0.5" style={{ fontSize:'10.5px', fontWeight:'700', color:accent.text, background:'#fff', padding:'4px 10px', borderRadius:'20px', border:`1px solid ${accent.border}` }}>
                        See all <ChevronRight size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {prods.map(prod => (
                        <ProductCard key={prod.id} product={prod} />
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
            <div className="h-4" />
          </div>
        )}

        {/* SCREEN 3: Category & Product Listing (Split screen) */}
        {activeTab === 'categories' && (
          <div className="flex h-[calc(100vh-190px)]">
            {/* Left Parent Sidebar */}
            <div className="w-20 bg-white border-r border-gray-100 flex flex-col overflow-y-auto no-scrollbar">
              {publishedCategories.map((cat) => {
                const isActive = cat.id === selectedCategory;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSearchQuery(''); // clear search when switching categories
                    }}
                    className={`py-3.5 px-1.5 flex flex-col items-center justify-center text-center border-l-4 transition-all duration-200 ${isActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-transparent text-text-medium hover:bg-gray-50'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full overflow-hidden border border-gray-150 mb-1 flex items-center justify-center flex-shrink-0 bg-gray-50 ${isActive ? 'scale-110 border-primary shadow-sm' : ''}`}>
                      <img src={getCategoryImage(cat.name, cat.icon)} alt={cat.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] font-black leading-tight line-clamp-2">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
              {publishedCategories.length === 0 && (
                <div className="p-3 text-[10px] text-text-muted text-center">None</div>
              )}
            </div>

            {/* Right Pane */}
            <div className="flex-1 flex flex-col bg-bg-light overflow-hidden">
              {/* Sticky Sort & Filter Utility Bar */}
              <div className="bg-white border-b border-gray-100 px-3 py-2 flex items-center justify-between text-xs font-bold text-text-medium shadow-sm">
                <span className="text-[10px] text-text-muted">
                  {getCategoryProducts().length} items in category
                </span>

                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal size={11} className="text-text-muted" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-transparent focus:outline-none text-[10px] font-extrabold cursor-pointer border border-gray-200 rounded px-1.5 py-0.5 text-text-dark"
                  >
                    <option value="default">Popularity</option>
                    <option value="low-high">Price: Low to High</option>
                    <option value="high-low">Price: High to Low</option>
                    <option value="savings">Discount Savings</option>
                  </select>
                </div>
              </div>

              {/* Grid Scroll Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-3">
                {getCategoryProducts().length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-4">
                    <p className="text-xs text-text-muted font-semibold">No products available in this category.</p>
                    <p className="text-[10px] text-text-muted/70 mt-0.5">Please check other categories or active pincodes.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {getCategoryProducts().map((prod) => (
                      <ProductCard key={prod.id} product={prod} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 4: Cart Screen */}
        {activeTab === 'cart' && (
          <div className="p-4 space-y-4">
            <h2 className="text-base font-black text-text-dark uppercase tracking-wider">Your Basket</h2>

            {getCartItemsCount() === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-premium space-y-3">
                <ShoppingCart size={42} className="text-text-muted mx-auto" />
                <h3 className="text-sm font-bold text-text-dark">Your basket is feeling light</h3>
                <p className="text-xs text-text-medium">Add products from home page or categories to start checkout.</p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="bg-primary text-white text-xs font-bold py-2 px-4 rounded-xl active-scale inline-block shadow-sm"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Itemized scroll view */}
                <div className="bg-white rounded-2xl border border-gray-50 overflow-hidden shadow-premium">
                  {Object.entries(cart).map(([prodId, qty]) => {
                    const prod = products.find(p => p.id === prodId);
                    if (!prod) return null;
                    return (
                      <div key={prodId} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 flex-shrink-0 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center p-1">
                          <img src={getProductImage(prod.name, prod.images)} alt={prod.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-text-dark truncate leading-tight">{prod.name}</h4>
                          <span className="text-[10px] text-text-muted block mt-0.5">{prod.unit} &bull; ₹{prod.price}</span>
                        </div>
                        {/* Quantity Counter */}
                        <div className="flex items-center bg-gray-100 border border-gray-250 rounded-lg overflow-hidden flex-shrink-0">
                          <button
                            onClick={() => updateCartQty(prodId, -1)}
                            className="px-2 py-1 text-text-dark hover:bg-gray-200 transition text-[10px] font-black"
                          >
                            -
                          </button>
                          <span className="px-2.5 text-[11px] font-black text-text-dark select-none">{qty}</span>
                          <button
                            onClick={() => updateCartQty(prodId, 1)}
                            className="px-2 py-1 text-text-dark hover:bg-gray-200 transition text-[10px] font-black"
                          >
                            +
                          </button>
                        </div>
                        {/* Subtotal */}
                        <div className="text-right flex-shrink-0 pl-1">
                          <span className="text-xs font-black text-text-success">₹{(prod.price * qty).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Apply Coupon Promo Card */}
                <div className="bg-white rounded-2xl border border-gray-50 p-4 shadow-premium space-y-3">
                  <h3 className="text-xs font-extrabold text-text-dark uppercase tracking-wider">Promo Coupon Codes</h3>

                  {appliedCoupon ? (
                    <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-green-600 text-white font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] text-green-800 font-bold">Applied Successfully!</span>
                      </div>
                      <button
                        onClick={() => setAppliedCoupon(null)}
                        className="text-text-muted hover:text-secondary text-[9px] font-black underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        className="flex-1 bg-bg-light border border-gray-200 rounded-xl px-3 py-2 text-xs uppercase font-extrabold focus:outline-none focus:ring-1 focus:ring-primary text-text-dark"
                      />
                      <button
                        type="submit"
                        className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-4 py-2 rounded-xl transition duration-150 active-scale"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <p className="text-secondary text-[9px] font-black">{couponError}</p>
                  )}

                  {/* List of active published coupons for easy clicking */}
                  {coupons.filter(c => c.status === 'published').length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Available Offers:</p>
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                        {coupons.filter(c => c.status === 'published').map(c => {
                          const isEligible = getCartTotals().itemTotal >= c.minSpend;
                          return (
                            <button
                              key={c.code}
                              onClick={() => {
                                setCouponCodeInput(c.code);
                                setAppliedCoupon(c);
                                setCouponError('');
                              }}
                              disabled={!isEligible}
                              className={`flex-shrink-0 border rounded-lg px-2.5 py-1 text-[9.5px] font-bold text-left transition select-none ${isEligible
                                ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 active-scale'
                                : 'border-gray-200 bg-gray-50 text-text-muted opacity-60 cursor-not-allowed'
                                }`}
                            >
                              <strong className="block uppercase tracking-wider">{c.code}</strong>
                              <span className="block text-[8.5px] font-medium leading-none mt-0.5">
                                {c.type === 'percentage' ? `${c.value}% Off` : c.type === 'flat' ? `₹${c.value} Off` : 'Free Delivery'}
                                <span className="block opacity-90 text-[7px] mt-0.5">Min spend: ₹{c.minSpend}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bill Summary Card */}
                <div className="bg-white rounded-2xl border border-gray-50 p-4 shadow-premium space-y-3">
                  <h3 className="text-xs font-extrabold text-text-dark uppercase tracking-wider border-b border-gray-100 pb-2">Bill Summary</h3>

                  <div className="space-y-2 text-xs font-semibold text-text-medium">
                    <div className="flex justify-between">
                      <span>Item Subtotal</span>
                      <span className="text-text-dark">₹{getCartTotals().itemTotal}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      {getCartTotals().deliveryFee === 0 ? (
                        <span className="text-text-success font-bold uppercase text-[10px]">Free</span>
                      ) : (
                        <span className="text-text-dark">₹{getCartTotals().deliveryFee}</span>
                      )}
                    </div>

                    {getCartTotals().savings > 0 && (
                      <div className="flex justify-between text-text-success">
                        <span>Discount Savings</span>
                        <span className="font-extrabold">-₹{getCartTotals().savings}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-black border-t border-gray-100 pt-2.5 text-text-dark">
                      <span>Grand Total</span>
                      <span className="text-base text-primary">₹{getCartTotals().grandTotal}</span>
                    </div>
                  </div>

                  {getCartTotals().itemTotal < 30 && (
                    <div className="bg-primary/5 rounded-lg p-2 text-center text-[10px] text-primary font-bold">
                      Add ₹{(30 - getCartTotals().itemTotal).toFixed(2)} more for FREE Delivery!
                    </div>
                  )}
                </div>

                {/* Proceed Checkout Button */}
                <button
                  onClick={() => {
                    if (!user) {
                      setIsAuthModalOpen(true);
                    } else {
                      setActiveTab('checkout');
                    }
                  }}
                  className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-bold py-3.5 rounded-xl transition duration-150 shadow-md active-scale flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>
        )}

        {/* SCREEN 5: Checkout Screen */}
        {activeTab === 'checkout' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setActiveTab('cart')}
                className="bg-white border border-gray-200 rounded-lg p-1.5 hover:bg-gray-50 active-scale"
              >
                <ArrowLeft size={16} className="text-text-dark" />
              </button>
              <h2 className="text-base font-black text-text-dark uppercase tracking-wider">Confirm Order</h2>
            </div>

            {/* Delivery Slot Selection */}
            <div className="bg-white rounded-2xl border border-gray-50 p-4 shadow-premium space-y-3">
              <h3 className="text-xs font-extrabold text-text-dark uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-primary" />
                <span>Select Delivery Schedule</span>
              </h3>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                  'Tomorrow, 7 AM - 10 AM',
                  'Tomorrow, 10 AM - 1 PM',
                  'Tomorrow, 1 PM - 4 PM',
                  'Tomorrow, 4 PM - 7 PM',
                  'Day After, 8 AM - 11 AM',
                  'Day After, 3 PM - 6 PM'
                ].map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3 py-2.5 rounded-xl border text-[10px] font-black whitespace-nowrap transition-all duration-150 active-scale ${isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-350 text-text-medium'
                        }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Address Confirmation */}
            <div className="bg-white rounded-2xl border border-gray-50 p-4 shadow-premium space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-xs font-extrabold text-text-dark uppercase tracking-wider">
                  Delivery Address
                </h3>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-primary text-[10px] font-black hover:underline"
                >
                  Edit/Change
                </button>
              </div>

              <div className="text-xs font-semibold text-text-medium space-y-1">
                <p className="text-text-dark font-extrabold">{deliveryAddress.name}</p>
                <p>{deliveryAddress.phone}</p>
                <p className="leading-relaxed opacity-95">{deliveryAddress.addressText}</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-50 p-4 shadow-premium space-y-3">
              <h3 className="text-xs font-extrabold text-text-dark uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={14} className="text-primary" />
                <span>Choose Payment Method</span>
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'UPI', title: 'UPI Payment (GPay, PhonePe, Paytm)' },
                  { id: 'Card', title: 'Credit / Debit / ATM Card' },
                  { id: 'COD', title: 'Cash / Pay on Delivery (COD)' }
                ].map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === pm.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-150 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment_opt"
                      value={pm.id}
                      checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="accent-primary h-4 w-4"
                    />
                    <span className="text-xs font-bold text-text-dark">{pm.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Order Summary & Place Action */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs font-bold mb-2.5 px-1.5">
                <span className="text-text-medium">Total Amount Due</span>
                <span className="text-base font-black text-primary">₹{getCartTotals().grandTotal}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full bg-secondary hover:bg-secondary-hover text-white text-sm font-bold py-3.5 rounded-xl transition duration-150 shadow-md active-scale flex items-center justify-center gap-2"
              >
                <span>Place Order</span>
                <span>(₹{getCartTotals().grandTotal})</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: Order Tracking Pipeline */}
        {activeTab === 'tracking' && (
          <div className="p-4 space-y-4">
            <h2 className="text-base font-black text-text-dark uppercase tracking-wider">Live Order Status</h2>

            {userOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-premium">
                <ClipboardList size={36} className="text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-muted">No orders placed yet.</p>
              </div>
            ) : (
              (() => {
                const activeOrder = trackingOrderId
                  ? userOrders.find(o => o.id === trackingOrderId)
                  : userOrders[0];

                if (!activeOrder) return null;

                const stepMap = {
                  'Confirmed': 1,
                  'Packed': 2,
                  'Out for Delivery': 3,
                  'Delivered': 4
                };
                const currentStep = stepMap[activeOrder.status] || 1;

                return (
                  <div className="space-y-4">
                    {/* Active Order Card */}
                    <div className="bg-white rounded-2xl border border-gray-50 p-4 shadow-premium space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="text-[10px] font-black text-text-muted uppercase">Order ID: {activeOrder.id}</span>
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                          {activeOrder.status}
                        </span>
                      </div>

                      {/* Timeline */}
                      <div className="relative py-4">
                        <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-gray-200"></div>
                        <div
                          className="absolute left-[15px] top-6 w-0.5 bg-primary transition-all duration-500"
                          style={{ height: `${((currentStep - 1) / 3) * 75}%` }}
                        ></div>

                        <div className="space-y-5 relative">
                          {[
                            { name: 'Confirmed', desc: 'Order received and verified' },
                            { name: 'Packed', desc: 'Items checked, packed & ready' },
                            { name: 'Out for Delivery', desc: 'Agent carrying your parcel' },
                            { name: 'Delivered', desc: 'Order left at location' }
                          ].map((step, idx) => {
                            const isDone = currentStep > idx;
                            const isCurrent = currentStep === idx + 1;

                            return (
                              <div key={step.name} className="flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs z-10 transition-all duration-300 ${isDone
                                  ? 'bg-primary border-primary text-white'
                                  : isCurrent
                                    ? 'bg-white border-primary text-primary shadow-sm scale-110'
                                    : 'bg-white border-gray-200 text-text-muted'
                                  }`}>
                                  {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                                </div>
                                <div className="pt-0.5">
                                  <h4 className={`text-xs font-black ${isCurrent ? 'text-primary' : 'text-text-dark'}`}>{step.name}</h4>
                                  <p className="text-[10px] text-text-medium mt-0.5">{step.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Summary Breakdown */}
                      <div className="border-t border-gray-100 pt-3 text-xs font-semibold text-text-medium space-y-1">
                        <div className="flex justify-between text-text-dark">
                          <span>Items Count:</span>
                          <span>{activeOrder.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                        </div>
                        <div className="flex justify-between text-text-dark">
                          <span>Total Savings:</span>
                          <span className="text-text-success font-bold">₹{activeOrder.summary.savings}</span>
                        </div>
                        <div className="flex justify-between text-text-dark font-black text-sm pt-1.5 border-t border-dotted">
                          <span>Paid:</span>
                          <span className="text-primary">₹{activeOrder.summary.grandTotal}</span>
                        </div>
                      </div>

                      {/* If Delivered, allow rating the products directly */}
                      {activeOrder.status === 'Delivered' && (
                        <div className="pt-2 border-t border-dotted mt-2">
                          {ratingSubmittedOrders.includes(activeOrder.id) ? (
                            <div className="text-center text-[10px] text-text-success font-black bg-green-50 border border-green-200 py-1.5 rounded-xl">
                              ★ Order Feedback Received
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setRateOrder(activeOrder);
                                const defaultRatings = {};
                                activeOrder.items.forEach(item => {
                                  defaultRatings[item.productId] = 5; // default 5 star
                                });
                                setRatingsForm(defaultRatings);
                              }}
                              className="w-full bg-primary hover:bg-primary-hover text-white text-[10px] font-black py-2 rounded-xl transition duration-150 active-scale shadow-sm"
                            >
                              Rate & Review Delivered Items
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* All Previous Orders Header */}
                    {userOrders.length > 1 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-extrabold text-text-dark uppercase tracking-wider">Your Order History</h3>
                        <div className="space-y-2">
                          {userOrders.map(order => (
                            <button
                              key={order.id}
                              onClick={() => setTrackingOrderId(order.id)}
                              className={`w-full text-left bg-white p-3 rounded-xl border flex justify-between items-center shadow-premium transition duration-150 active-scale ${order.id === activeOrder.id ? 'border-primary' : 'border-gray-150'
                                }`}
                            >
                              <div>
                                <p className="text-[10px] font-black text-text-muted uppercase">ID: {order.id}</p>
                                <p className="text-xs font-bold text-text-dark mt-0.5">Total: ₹{order.summary.grandTotal}</p>
                              </div>
                              <span className="bg-primary/5 text-primary text-[10px] font-black px-2 py-0.5 rounded-full border border-primary/10">
                                {order.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* SCREEN: Profile / Account */}
        {activeTab === 'profile' && (
          <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-120px)] no-scrollbar pb-8">
            <h2 className="text-base font-black text-text-dark uppercase tracking-wider">My Profile</h2>

            {/* Profile detail card */}
            <div className="bg-white rounded-2xl border border-gray-50 p-4 shadow-premium text-center space-y-3">
              <div className="w-16 h-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-primary/10">
                {user ? user.phone.slice(-4) : '?'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-dark">
                  {user ? `Registered Customer (+91 ${user.phone})` : 'Guest Shopper'}
                </h3>
                <p className="text-[10px] text-text-medium mt-0.5">
                  Pincode active: {pincode}
                </p>
                {user && (
                  <div className="mt-2 text-left bg-gray-50 border rounded-xl p-3 text-[11px] font-semibold space-y-1.5 text-text-medium">
                    <p><strong className="text-text-dark">Name:</strong> {user.name || 'Not provided'}</p>
                    <p><strong className="text-text-dark">Email:</strong> {user.email || 'Not provided'}</p>
                    <p className="leading-tight"><strong className="text-text-dark">Address:</strong> {user.addressText || 'Not provided'}</p>
                  </div>
                )}
              </div>

              {user ? (
                <button
                  onClick={() => {
                    auth.signOut();
                    setUser(null);
                    setActiveTab('home');
                  }}
                  className="w-full mt-2 bg-secondary/5 hover:bg-secondary/10 border border-secondary/15 text-secondary text-xs font-bold py-2.5 rounded-xl transition duration-150 active-scale flex items-center justify-center gap-1.5"
                >
                  <LogOut size={14} />
                  <span>Logout Phone Session</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full mt-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 rounded-xl transition duration-150 shadow-sm active-scale"
                >
                  Login/Register
                </button>
              )}
            </div>

            {/* Notification center */}
            <div className="bg-white rounded-2xl border border-gray-50 p-4 shadow-premium space-y-3">
              <h3 className="text-xs font-extrabold text-text-dark uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary" />
                <span>Store Announcements</span>
              </h3>
              <div className="space-y-2.5">
                {notifications.map((notif) => (
                  <div key={notif.id} className="border border-gray-100 rounded-xl p-2.5 bg-gray-50/50 space-y-1">
                    <h4 className="text-[10px] font-black text-text-dark uppercase tracking-wide">{notif.title}</h4>
                    <p className="text-[10px] text-text-medium leading-relaxed font-sans">{notif.message}</p>
                    <span className="text-[8px] text-text-muted block mt-1">
                      {new Date(notif.sentTime || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-[10px] text-text-muted text-center py-4">No recent store notices.</p>
                )}
              </div>
            </div>

            {/* Customer support desk */}
            {user && (
              <div className="bg-white rounded-2xl border border-gray-50 p-4 shadow-premium space-y-4">
                <h3 className="text-xs font-extrabold text-[#EA2B2B] uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList size={13} className="text-[#EA2B2B]" />
                  <span>Customer Support Desk</span>
                </h3>

                {supportSuccessMsg && (
                  <div className="bg-green-50 border border-green-200 text-green-800 text-[10px] font-black p-2.5 rounded-xl text-center">
                    {supportSuccessMsg}
                  </div>
                )}

                {/* Raise support ticket */}
                <form onSubmit={handleSupportSubmit} className="space-y-2.5">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-text-medium block mb-1">Inquiry Type</label>
                    <select
                      value={supportType}
                      onChange={(e) => setSupportType(e.target.value)}
                      className="w-full bg-bg-light border border-gray-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-dark font-bold"
                    >
                      <option value="Delivery Issue">Delivery Delay or Issue</option>
                      <option value="Double Charged">Double Charged billing</option>
                      <option value="Damaged Item">Damaged product items</option>
                      <option value="Other">Other general inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-text-medium block mb-1">Detailed Message</label>
                    <textarea
                      rows={3}
                      placeholder="Explain your problem..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="w-full bg-bg-light border border-gray-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-dark font-medium font-sans animate-fade-in"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover text-white text-[10px] font-black py-2.5 rounded-xl transition duration-150 active-scale"
                  >
                    Submit Support Ticket
                  </button>
                </form>

                {/* Ticket history */}
                <div className="pt-2 border-t space-y-2">
                  <h4 className="text-[10px] font-black text-text-dark uppercase tracking-wider">Your Submitted Tickets</h4>
                  <div className="space-y-2.5">
                    {supportTickets.filter(t => t.phone === user.phone).map((ticket) => (
                      <div key={ticket.id} className="border border-gray-150 rounded-xl p-2.5 bg-white space-y-2">
                        <div className="flex justify-between items-center text-[8.5px] font-black text-text-muted">
                          <span>TYPE: {ticket.type}</span>
                          <span className={`px-1.5 py-0.5 rounded-full ${ticket.status === 'Open' ? 'bg-secondary/10 text-secondary' : 'bg-green-100 text-green-700'}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-medium font-sans">"{ticket.message}"</p>
                        {ticket.replyMessage && (
                          <div className="bg-green-50 border border-green-200/50 p-2 rounded-lg text-[9.5px]">
                            <p className="font-black text-green-700 uppercase tracking-widest text-[8px] mb-0.5">Response:</p>
                            <p className="font-bold text-text-dark font-sans">"{ticket.replyMessage}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {supportTickets.filter(t => t.phone === user.phone).length === 0 && (
                      <p className="text-[9px] text-text-muted text-center">You haven't submitted any support requests.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Floating Cart Toast ── */}
      {getCartItemsCount() > 0 && activeTab !== 'cart' && activeTab !== 'checkout' && (
        <div className="absolute bottom-16 left-3 right-3 z-30 animate-slide-in">
          <button
            onClick={() => setActiveTab('cart')}
            className="btn-press w-full flex items-center justify-between px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, #0B6F3A 0%, #14a857 100%)',
              borderRadius: '16px',
              boxShadow: '0 8px 28px rgba(11,111,58,0.45), 0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '7px', backdropFilter: 'blur(4px)' }}>
                <ShoppingCart size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', lineHeight: 1 }}>
                  {getCartItemsCount()} item{getCartItemsCount() > 1 ? 's' : ''} in basket
                </span>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: '800', display: 'block', lineHeight: 1.3 }}>
                  ₹{getCartTotals().itemTotal}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1" style={{ color: '#fff', fontSize: '11px', fontWeight: '800' }}>
              View Basket <ChevronRight size={14} strokeWidth={3} />
            </div>
          </button>
        </div>
      )}

      {/* ── Premium Bottom Tab Bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 grid grid-cols-5"
        style={{
          height: '58px',
          background: '#ffffff',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'categories', label: 'Categories', icon: Grid },
          { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: getCartItemsCount() },
          { id: 'orders', label: 'Orders', icon: ClipboardList },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn-press flex flex-col items-center justify-center relative"
              style={{ paddingTop: '2px' }}
            >
              {/* Active indicator pill */}
              {isActive && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '28px', height: '3px', background: 'linear-gradient(135deg,#0B6F3A,#14a857)', borderRadius: '0 0 4px 4px' }} />
              )}
              <div className="relative">
                <div
                  style={{
                    width: '34px',
                    height: '26px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? 'linear-gradient(135deg,#E7F5ED,#c8ead6)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? '#0B6F3A' : '#9e9e9e', transition: 'color 0.2s' }}
                  />
                </div>
                {tab.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 flex items-center justify-center"
                    style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#EE4224', color: '#fff', fontSize: '8px', fontWeight: '800', boxShadow: '0 2px 6px rgba(238,66,36,0.5)' }}
                  >
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: isActive ? '800' : '600',
                  color: isActive ? '#0B6F3A' : '#9e9e9e',
                  marginTop: '2px',
                  letterSpacing: '0.02em',
                  transition: 'color 0.2s',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-55">
          <div className="bg-white rounded-t-2xl w-full p-5 space-y-4 animate-slide-up shadow-lg">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black text-text-dark uppercase tracking-wider">Change Delivery Info</h3>
              <button
                onClick={() => {
                  setTempAddress({ ...deliveryAddress });
                  setIsAddressModalOpen(false);
                }}
                className="text-xs font-black text-text-muted hover:text-text-dark"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-text-medium block mb-1">Receiver Name</label>
                <input
                  type="text"
                  value={tempAddress.name}
                  onChange={(e) => setTempAddress(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-bg-light border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-dark"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-text-medium block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={tempAddress.phone}
                  onChange={(e) => setTempAddress(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-bg-light border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-dark"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-text-medium block mb-1">Full Street Address</label>
                <textarea
                  value={tempAddress.addressText}
                  rows={2}
                  onChange={(e) => setTempAddress(prev => ({ ...prev, addressText: e.target.value }))}
                  className="w-full bg-bg-light border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-dark resize-none"
                />
              </div>

              {/* Interactive map centered on dynamic OSM coordinates */}
              <div className="pt-1">
                <label className="text-[10px] uppercase font-bold text-text-medium block mb-1">Estimated Map View</label>
                <div className="relative w-full h-24 bg-gray-50 border border-gray-150 rounded-xl overflow-hidden shadow-inner">
                  <iframe
                    title="Delivery Street Map"
                    className="absolute top-0 left-0 w-full"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lon - 0.005}%2C${mapCoords.lat - 0.005}%2C${mapCoords.lon + 0.005}%2C${mapCoords.lat + 0.005}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lon}`}
                    style={{ border: 0, height: '130px' }}
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!tempAddress.name.trim() || !tempAddress.phone.trim() || !tempAddress.addressText.trim()) {
                  alert('Please enter your Name, Contact Phone, and Full Street Address.');
                  return;
                }
                setDeliveryAddress(tempAddress);
                setIsAddressModalOpen(false);
              }}
              className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3 rounded-xl transition duration-150 active-scale shadow-sm"
            >
              Save Address Details
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS MODAL (High-Fidelity Product View overlay) */}
      {selectedProductDetails && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setSelectedProductDetails(null)}>
          <div
            className="bg-white rounded-3xl w-full max-w-[325px] overflow-hidden shadow-floating flex flex-col border border-gray-150 relative animate-pop scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button overlay */}
            <button
              onClick={() => setSelectedProductDetails(null)}
              className="absolute right-4 top-4 bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 h-7 w-7 rounded-full flex items-center justify-center text-xs font-black z-10"
            >
              ✕
            </button>

            {/* Product Image Area */}
            <div className="w-full h-44 bg-slate-50 flex items-center justify-center p-6 relative border-b border-gray-100">
              <img
                src={getProductImage(selectedProductDetails.name, selectedProductDetails.images)}
                alt={selectedProductDetails.name}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
              {selectedProductDetails.mrp > selectedProductDetails.price && (
                <div className="absolute bottom-3 left-3 bg-secondary text-white font-extrabold text-[9px] px-2 py-0.5 rounded shadow-sm">
                  {Math.round(((selectedProductDetails.mrp - selectedProductDetails.price) / selectedProductDetails.mrp) * 100)}% OFF
                </div>
              )}
            </div>

            {/* Scrollable details wrapper */}
            <div className="p-5 space-y-3.5 flex-1 overflow-y-auto no-scrollbar max-h-[300px]">
              <div>
                <span className="text-[8px] bg-primary/10 text-primary font-black px-2 py-0.5 rounded uppercase tracking-widest">{selectedProductDetails.brand || 'UshaMart'}</span>
                <h3 className="text-sm font-black text-text-dark leading-tight mt-1">{selectedProductDetails.name}</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Department: {selectedProductDetails.department || 'Grocery'}</p>
              </div>

              {/* Price & Savings */}
              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs text-text-muted block">Our Price</span>
                  <span className="text-base font-black text-text-success">₹{selectedProductDetails.price}</span>
                </div>
                {selectedProductDetails.mrp > selectedProductDetails.price && (
                  <>
                    <div className="h-6 w-px bg-gray-250"></div>
                    <div>
                      <span className="text-xs text-text-muted block">MRP Original</span>
                      <span className="text-xs text-text-muted line-through font-bold">₹{selectedProductDetails.mrp}</span>
                    </div>
                    <div className="h-6 w-px bg-gray-250"></div>
                    <div>
                      <span className="text-xs text-text-muted block">Your Savings</span>
                      <span className="text-xs text-text-success font-black">₹{(selectedProductDetails.mrp - selectedProductDetails.price).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Description Paragraph */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-text-dark uppercase tracking-wider">Product Description</h4>
                <p className="text-[10.5px] text-text-medium leading-relaxed font-sans font-medium">
                  {selectedProductDetails.description || 'No description provided by the regional distributor.'}
                </p>
              </div>

              {/* Aisle Location & Stock status */}
              <div className="flex gap-2">
                {selectedProductDetails.locationId && (
                  <div className="flex-1 flex items-center justify-center gap-1 text-[9px] font-black text-slate-700 bg-slate-100 border rounded-xl py-2">
                    <MapPin size={11} className="text-primary" />
                    <span>Aisle {selectedProductDetails.locationId}</span>
                  </div>
                )}
                <div className={`flex-1 text-center py-2 rounded-xl text-[9px] font-black border ${selectedProductDetails.stock === 0 ? 'bg-red-50 text-[#EA2B2B] border-red-150' : 'bg-green-50 text-text-success border-green-150'}`}>
                  {selectedProductDetails.stock === 0 ? 'OUT OF STOCK' : `IN STOCK (${selectedProductDetails.stock} units)`}
                </div>
              </div>
            </div>

            {/* Stepper / Add button footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-150 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase">Size/Qty</span>
                <span className="block text-xs font-black text-text-dark mt-0.5">{selectedProductDetails.unit}</span>
              </div>

              {cart[selectedProductDetails.id] > 0 ? (
                <div className="flex items-center bg-primary text-white rounded-xl overflow-hidden border border-primary shadow-sm">
                  <button
                    onClick={() => updateCartQty(selectedProductDetails.id, -1)}
                    className="px-3 py-2 hover:bg-primary-hover active:scale-95 transition-all text-xs font-black"
                  >
                    -
                  </button>
                  <span className="px-3 font-bold text-xs select-none">{cart[selectedProductDetails.id]}</span>
                  <button
                    onClick={() => updateCartQty(selectedProductDetails.id, 1)}
                    className="px-3 py-2 hover:bg-primary-hover active:scale-95 transition-all text-xs font-black"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => updateCartQty(selectedProductDetails.id, 1)}
                  disabled={selectedProductDetails.stock === 0}
                  className={`text-xs font-bold px-6 py-2.5 rounded-xl border transition duration-150 active-scale shadow-sm ${selectedProductDetails.stock === 0
                    ? 'bg-gray-100 border-gray-200 text-text-muted cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-hover hover:border-transparent'
                    }`}
                >
                  {selectedProductDetails.stock === 0 ? 'Out of Stock' : 'Add to Basket'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RATINGS / FEEDBACK MODAL (Stunning custom order checkout review) */}
      {rateOrder && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setRateOrder(null)}>
          <div
            className="bg-white rounded-3xl w-full max-w-[325px] p-5 space-y-4 shadow-floating border border-gray-150 relative animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setRateOrder(null)}
              className="absolute right-4 top-3 text-text-muted hover:text-text-dark text-xs font-extrabold"
            >
              ✕
            </button>

            <div className="text-center">
              <h3 className="text-sm font-black text-text-dark uppercase tracking-wider">Rate Order: {rateOrder.id.slice(0, 8)}</h3>
              <p className="text-[10px] text-text-medium mt-1">
                How was the delivery and product freshness?
              </p>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
              {rateOrder.items.map((item) => {
                const prod = products.find(p => p.id === item.productId);
                const currentRating = ratingsForm[item.productId] || 0;
                return (
                  <div key={item.productId} className="border border-gray-150 rounded-xl p-3 bg-gray-50/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-white border rounded flex items-center justify-center p-0.5">
                        <img src={getProductImage(item.name, prod?.images || [])} alt={item.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="text-[10px] font-black text-text-dark truncate flex-1">{item.name}</span>
                    </div>

                    {/* Star Rating Selectors */}
                    <div className="flex gap-1.5 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingsForm(prev => ({ ...prev, [item.productId]: star }))}
                          className={`text-base transition-all transform active-scale ${star <= currentRating ? 'text-amber-500 scale-110 shadow-sm' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3 rounded-xl transition duration-150 shadow-sm active-scale"
              >
                Submit Ratings
              </button>
            </form>
          </div>
        </div>
      )}
      {/* PHONE AUTHENTICATION DIALOG */}
      {isAuthModalOpen && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl w-full max-w-[280px] p-5 space-y-4 shadow-lg text-center relative animate-pop">
            <button
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthPhone('');
                setAuthOtp('');
                setAuthStep(1);
                authError('');
              }}
              className="absolute right-4 top-3 text-text-muted hover:text-text-dark text-xs font-extrabold"
            >
              ✕
            </button>

            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
              <Phone size={24} />
            </div>

            <div>
              <h3 className="text-sm font-black text-text-dark uppercase tracking-wider">
                {authStep === 1 ? 'Verify Phone Number' : 'Verification Code'}
              </h3>
              <p className="text-[10px] text-text-medium mt-1">
                {authStep === 1
                  ? 'We need to verify your number before checkout.'
                  : `Enter the 4-digit code sent to +91 ${authPhone}`
                }
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authStep === 1 ? (
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="10-Digit Mobile Number"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-bg-light border border-gray-250 rounded-xl py-2.5 px-3 text-center text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-dark font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter OTP (e.g. 1234)"
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-bg-light border border-gray-250 rounded-xl py-2.5 px-3 text-center text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-dark font-bold tracking-widest"
                  />
                  <div className="text-left mt-1 text-[9px] text-text-muted">Hint: Enter 1234 or any code to login.</div>
                </div>
              )}

              {authError && (
                <p className="text-secondary text-[10px] font-bold">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 rounded-xl transition duration-150 shadow-sm active-scale flex items-center justify-center gap-1.5"
              >
                {isAuthLoading && <Loader2 size={12} className="animate-spin" />}
                <span>{authStep === 1 ? 'Request OTP' : 'Submit & Login'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── PINCODE CHANGE MODAL ──────────────────────────────────────────── */}
      {showPincodeModal && (
        <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-[60]"
          onClick={() => setShowPincodeModal(false)}>
          <div className="bg-white rounded-t-3xl w-full p-5 animate-slide-up shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-900">Change Delivery Location</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Enter a pincode to check serviceability</p>
              </div>
              <button onClick={() => setShowPincodeModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-black">
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={e => {
              e.preventDefault();
              const clean = pincodeInput.trim();
              if (!/^\d{6}$/.test(clean)) {
                setPincodeModalError('Please enter a valid 6-digit pincode.');
                return;
              }
              const isAvailable = serviceablePincodes.includes(clean);
              const cfg = pincodeConfigs.find(c => c.code === clean);
              if (isAvailable && cfg?.enabled !== false) {
                setPincode(clean);
                localStorage.setItem('ushamart_active_pincode', clean);
                setPincodeModalError('');
                setShowPincodeModal(false);
              } else {
                setPincodeModalError(`Sorry, we don't deliver to ${clean} yet.`);
              }
            }} className="space-y-3">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={e => { setPincodeInput(e.target.value.replace(/\D/g, '')); setPincodeModalError(''); }}
                  placeholder="Enter 6-digit pincode"
                  autoFocus
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Error state — shows serviceable pincodes */}
              {pincodeModalError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2.5">
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                    ⚠️ {pincodeModalError}
                  </p>
                  {serviceablePincodes.length > 0 && (
                    <>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">
                        We currently deliver to:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {serviceablePincodes
                          .filter(p => pincodeConfigs.find(c => c.code === p)?.enabled !== false)
                          .map(p => (
                            <button key={p} type="button"
                              onClick={() => { setPincodeInput(p); setPincodeModalError(''); }}
                              className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition">
                              {p}
                            </button>
                          ))
                        }
                      </div>
                    </>
                  )}
                </div>
              )}

              <button type="submit" disabled={pincodeInput.length !== 6}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-primary/20">
                Apply Pincode
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
