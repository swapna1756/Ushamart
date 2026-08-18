import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, ChevronDown } from 'lucide-react';
import { productsApi, categoriesApi, specialOffersApi, pincodesApi } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import BrandName from '../components/BrandName';
import { resolveImageUrl } from '../utils/asset';

export default function HomePage() {
 const { pincode, setPincode } = useCart();
 const [products, setProducts] = useState([]);
 const [categories,setCategories]= useState([]);
 const [offers, setOffers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [carouselIdx, setCarouselIdx] = useState(0);
 const [showPinModal, setShowPinModal] = useState(false);
 const [pinInput, setPinInput] = useState('');
 const [pinError, setPinError] = useState('');
 const navigate = useNavigate();

 const loadData = () => {
 setLoading(true);
 setError('');
 // Never pass pincode as param ... backend returns all published products
 // Pincode filtering is done client-side so we always have all products loaded
 Promise.all([
 productsApi.getAll(), // fetch ALL published products, no pincode filter
 categoriesApi.getAll(),
 specialOffersApi.getAll(),
 ]).then(([p, c, o]) => {
 setProducts(p.data || []);
 setCategories(c.data || []);
 setOffers(o.data || []);
 }).catch(err => {
 console.error('[HomePage] fetch error:', err);
 setError(err.message || 'Failed to load products.');
 }).finally(() => setLoading(false));
 };

 useEffect(() => { loadData(); }, []); // load once on mount, not on every pincode change

 // Filter products client-side by pincode (if a pincode is set)
 const visibleProducts = products.filter(p => {
 if (!pincode) return true; // no pincode set ? show all
 if (!p.pincodesAvailable || p.pincodesAvailable.length === 0) return true; // available everywhere
 return p.pincodesAvailable.includes(pincode);
 });

 // Auto-advance carousel
 useEffect(() => {
 if (offers.length <= 1) return;
 const t = setInterval(() => setCarouselIdx(i => (i + 1) % offers.length), 4000);
 return () => clearInterval(t);
 }, [offers.length]);

 const featured = visibleProducts.filter(p => p.featured || p.bestSeller);
 const todayDeals = visibleProducts.filter(p => p.todayOffer || (p.mrp > p.price && ((p.mrp - p.price) / p.mrp) >= 0.10));
 const newArrivals= visibleProducts.filter(p => p.newArrival);

 const handlePincodeSubmit = async (e) => {
 e.preventDefault();
 setPinError('');
 if (!/^\d{6}$/.test(pinInput.trim())) { setPinError('Enter a valid 6-digit pincode.'); return; }
 try {
 const res = await pincodesApi.check(pinInput.trim());
 if (res.serviceable) {
 setPincode(pinInput.trim());
 setShowPinModal(false);
 setPinInput('');
 } else {
 setPinError('Sorry, we don\'t deliver to this pincode yet.');
 }
 } catch { setPinError('Could not check pincode. Try again.'); }
 };

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center min-h-screen gap-3">
 <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full spin" />
 <p className="text-xs text-muted font-medium">Loading products...</p>
 </div>
 );
 }

 if (error) {
 return (
 <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
 <span className="text-5xl mb-4">🛒</span>
 <h2 className="text-base font-semibold text-gray-700 mb-1">Could not load products</h2>
 <p className="text-xs text-muted mb-6 max-w-xs">{error}</p>
 <button onClick={loadData}
 className="btn-press px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover shadow-md">
 Try Again
 </button>
 </div>
 );
 }

 const FALLBACK_OFFER = { id:'f1', title:'Fresh Picks Today', subtitle:'Farm-fresh produce at your door.',
 badgeText:'EXPRESS', buttonText:'SHOP NOW', bgColor:'#dcfce7',
 imageUrl:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80' };
 const displayOffers = offers.length > 0 ? offers : [FALLBACK_OFFER];
 const curOffer = displayOffers[carouselIdx % displayOffers.length];

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Header */}
 <div className="sticky top-0 z-20 bg-white shadow-sm">
 <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-3 pb-2">
 {/* Location row */}
 <div className="flex items-center justify-between mb-2">
 <button onClick={() => { setPinInput(pincode); setPinError(''); setShowPinModal(true); }}
 className="flex items-center gap-1.5 text-left btn-press">
 <MapPin size={14} className="text-violet-600 flex-shrink-0" />
 <div>
 <p className="text-xs text-label leading-none">Deliver to</p>
 <div className="flex items-center gap-0.5">
 <p className="text-xs font-medium text-gray-900">{pincode || 'Set pincode'}</p>
 <ChevronDown size={12} className="text-violet-600" />
 </div>
 </div>
 </button>
 <div className="flex items-center gap-2">
 <div style={{ width:'36px', height:'36px', borderRadius:'10px', border:'2px solid #0B6F3A',
 background:'#fff', padding:'3px', overflow:'hidden', flexShrink:0,
 boxShadow:'0 2px 8px rgba(11,111,58,0.18)' }}>
 <img src="/logo.png" alt="UshaMart"
 style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
 </div>
 <BrandName size="md" />
 </div>
 </div>
 {/* Search bar */}
 <button onClick={() => navigate('/search')}
 className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-gray-100 rounded-xl text-left hover:bg-gray-200 transition">
 <Search size={15} className="text-gray-400 flex-shrink-0" />
 <span className="text-sm text-gray-400 font-medium">Search groceries, fruits, snacks...</span>
 </button>
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-24 lg:pb-8 space-y-6 pt-4">
 {/* Carousel */}
 {displayOffers.length > 0 && (
 <div className="rounded-2xl overflow-hidden shadow-md relative cursor-pointer"
 style={{ background: curOffer.bgColor || '#dcfce7', minHeight: '140px' }}
 onClick={() => navigate('/categories')}>
 <div className="flex items-center justify-between p-5 min-h-[140px]">
 <div className="flex-1 pr-3 z-10">
 {curOffer.badgeText && (
 <span className="inline-block mb-2 px-3 py-1 text-[10px] font-medium rounded-full bg-black/20 text-white">
 {curOffer.badgeText}
 </span>
 )}
 <h2 className="text-lg font-semibold leading-tight text-gray-900 mb-2">{curOffer.title}</h2>
 {curOffer.subtitle && <p className="text-xs text-gray-600 mb-3">{curOffer.subtitle}</p>}
 <button className="px-5 py-2 rounded-full text-xs font-medium text-white bg-primary shadow-md">
 {curOffer.buttonText || 'SHOP NOW'}
 </button>
 </div>
 {curOffer.imageUrl && (
 <div className="w-28 h-28 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
 <img src={resolveImageUrl(curOffer.imageUrl)} alt={curOffer.title} className="w-full h-full object-cover"
 onError={e => { e.target.src = '/logo.png'; }} />
 </div>
 )}
 </div>
 {/* Dots */}
 {displayOffers.length > 1 && (
 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
 {displayOffers.map((_, i) => (
 <div key={i} onClick={e => { e.stopPropagation(); setCarouselIdx(i); }}
 className="h-1.5 rounded-full transition-all" style={{ width: i === carouselIdx % displayOffers.length ? '18px' : '6px', background: i === carouselIdx % displayOffers.length ? '#0B6F3A' : 'rgba(0,0,0,0.2)' }} />
 ))}
 </div>
 )}
 </div>
 )}

 {/* Categories */}
 {categories.length > 0 && (
 <div>
 <div className="flex items-center justify-between mb-3">
 <h2 className="text-page-title text-gray-900">Shop by Category</h2>
 <button onClick={() => navigate('/categories')} className="flex items-center gap-0.5 text-xs font-medium text-primary">
 See All <ChevronRight size={14} />
 </button>
 </div>
 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
 {categories.slice(0, 10).map(cat => (
 <button key={cat.id} onClick={() => navigate(`/categories?cat=${cat.id}`)}
 className="btn-press flex-shrink-0 flex flex-col items-center gap-1.5">
 <div className="w-16 h-16 rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm flex items-center justify-center p-1">
 {cat.icon
 ? <img src={resolveImageUrl(cat.icon)} alt={cat.name} className="w-full h-full object-cover rounded-xl"
 onError={e => { e.target.src = '/logo.png'; }} />
 : <span className="text-2xl">{cat.emojiIcon || '🛍️'}</span>
 }
 </div>
 <span className="text-xs font-medium text-gray-800 text-center w-16 leading-tight line-clamp-2">
 {cat.emojiIcon && cat.emojiIcon + ' '}{cat.name}
 </span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Featured / Best Sellers */}
 {featured.length > 0 && (
 <section>
 <div className="flex items-center justify-between mb-3">
 <h2 className="text-page-title text-gray-900">✨ Picked For You</h2>
 <button onClick={() => navigate('/categories')} className="flex items-center gap-0.5 text-xs font-medium text-primary">
 View All <ChevronRight size={14} />
 </button>
 </div>
 <div className="grid grid-cols-2 min-[481px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
 {featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
 </div>
 </section>
 )}

 {/* Today's Deals */}
 {todayDeals.length > 0 && (
 <section>
 <div className="flex items-center justify-between mb-3">
 <h2 className="text-page-title text-gray-900">🔥 Today's Deals</h2>
 <button onClick={() => navigate('/categories')} className="flex items-center gap-0.5 text-xs font-medium text-primary">
 View All <ChevronRight size={14} />
 </button>
 </div>
 <div className="grid grid-cols-2 min-[481px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
 {todayDeals.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
 </div>
 </section>
 )}

 {/* New Arrivals */}
 {newArrivals.length > 0 && (
 <section>
 <div className="flex items-center justify-between mb-3">
 <h2 className="text-page-title text-gray-900">🆕 New Arrivals</h2>
 </div>
 <div className="grid grid-cols-2 min-[481px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
 {newArrivals.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
 </div>
 </section>
 )}

 {/* All products fallback ... when none have featured/deal/new flags */}
 {featured.length === 0 && todayDeals.length === 0 && visibleProducts.length > 0 && (
 <section>
 <h2 className="text-page-title text-gray-900 mb-3">All Products</h2>
 <div className="grid grid-cols-2 min-[481px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
 {visibleProducts.map(p => <ProductCard key={p.id} product={p} />)}
 </div>
 </section>
 )}

 {/* No products available */}
 {visibleProducts.length === 0 && (
 <div className="flex flex-col items-center justify-center py-16 text-center">
 <span className="text-5xl mb-4">🛍️</span>
 <p className="text-sm font-semibold text-gray-700">No Products Available</p>
 <p className="text-xs text-gray-400 mt-1 max-w-xs">
 {pincode
 ? `No products available for pincode ${pincode}. Try a different pincode or check back later.`
 : 'No products have been added yet. Check back soon!'
 }
 </p>
 {pincode && (
 <button onClick={() => setPincode('')}
 className="btn-press mt-4 px-4 py-2 rounded-xl text-xs font-medium text-primary border border-primary hover:bg-primary/5 transition">
 Show All Pincodes
 </button>
 )}
 <button onClick={loadData}
 className="btn-press mt-3 px-4 py-2 rounded-xl text-xs font-medium text-white bg-primary hover:bg-primary-hover shadow-sm transition">
 Refresh
 </button>
 </div>
 )}
 </div>

 {/* Pincode Modal */}
 {showPinModal && (
 <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
 onClick={() => setShowPinModal(false)}>
 <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slideUp shadow-2xl"
 onClick={e => e.stopPropagation()}>
 <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
 <h3 className="text-sm font-semibold text-gray-900 mb-1">Change Delivery Location</h3>
 <p className="text-xs text-gray-400 mb-4">Enter your pincode to check availability</p>
 <form onSubmit={handlePincodeSubmit} className="space-y-3">
 <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-primary transition">
 <MapPin size={14} className="ml-3 text-violet-600 flex-shrink-0" />
 <input type="text" inputMode="numeric" maxLength={6} value={pinInput}
 onChange={e => { setPinInput(e.target.value.replace(/\D/g,'').slice(0,6)); setPinError(''); }}
 placeholder="6-digit pincode" autoFocus
 className="flex-1 px-3 py-3 text-sm font-semibold focus:outline-none" />
 </div>
 {pinError && <p className="text-xs text-red-500 font-semibold">{pinError}</p>}
 <button type="submit" disabled={pinInput.length !== 6}
 className="btn-press w-full py-3 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition shadow-md">
 Apply Pincode
 </button>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
