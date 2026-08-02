import React, { useState, useEffect } from 'react';
import {
  MapPin, Search, ChevronRight, ShoppingBag, Home, Grid, ClipboardList,
  User, ArrowLeft, Plus, Minus, Check, SlidersHorizontal, X,
  ShoppingCart, Loader2, Phone, Lock, Calendar, CreditCard, Sparkles, LogOut,
  Bell, Heart, Clock, Navigation, ChevronDown
} from 'lucide-react';
import { db, auth } from '../db/mockFirebase';
import SplashScreen from './SplashScreen';

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

// ─── Product Reviews Component ────────────────────────────────────────────────
function ProductReviews({ productId, user, userOrders }) {
  const [reviews,        setReviews]        = useState([]);
  const [myRating,       setMyRating]       = useState(0);
  const [hoverRating,    setHoverRating]    = useState(0);
  const [reviewText,     setReviewText]     = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [submitMsg,      setSubmitMsg]      = useState('');
  const [submitErr,      setSubmitErr]      = useState('');
  const [editMode,       setEditMode]       = useState(false);
  const [myReview,       setMyReview]       = useState(null);

  // Load reviews for this product
  useEffect(() => {
    if (!productId) return;
    const unsub = db.collection('product_reviews').onSnapshot((all) => {
      const forProduct = all
        .filter(r => r.productId === productId)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setReviews(forProduct);

      // Find current user's review
      if (user) {
        const mine = forProduct.find(r => r.userId === (user.uid || user.phone));
        if (mine) {
          setMyReview(mine);
          if (!editMode) {
            setMyRating(mine.rating || 0);
            setReviewText(mine.comment || '');
          }
        } else {
          setMyReview(null);
        }
      }
    });
    return () => unsub();
  }, [productId, user]);

  // Average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  // Check if user has a verified purchase of this product
  const isVerifiedPurchase = userOrders.some(o =>
    (o.items || []).some(i => i.productId === productId)
  );

  const handleSubmit = async () => {
    setSubmitErr('');
    if (myRating < 1) { setSubmitErr('Please select at least 1 star.'); return; }
    setSubmitting(true);
    try {
      const userId   = user?.uid || user?.phone || 'guest';
      const userName = user?.name || ('Customer ' + (user?.phone?.slice(-4) || ''));
      const payload  = {
        productId,
        userId,
        userName,
        rating:    myRating,
        comment:   reviewText.trim(),
        verified:  isVerifiedPurchase,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (myReview) {
        // Update existing review
        await db.collection('product_reviews').update(myReview.id, {
          rating:    myRating,
          comment:   reviewText.trim(),
          updatedAt: Date.now(),
        });
      } else {
        await db.collection('product_reviews').add(payload);
      }
      setSubmitMsg('Thank you for your review ✓');
      setEditMode(false);
      setTimeout(() => setSubmitMsg(''), 3000);
    } catch (e) {
      console.error('[ProductReviews] submit failed:', e);
      setSubmitErr('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    try {
      await db.collection('product_reviews').delete(myReview.id);
      setMyRating(0);
      setReviewText('');
      setMyReview(null);
      setEditMode(false);
    } catch (e) {
      console.error('[ProductReviews] delete failed:', e);
    }
  };

  const fmtRelTime = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d} day${d !== 1 ? 's' : ''} ago`;
  };

  const showForm = !myReview || editMode;

  return (
    <div className="space-y-3 pt-1">
      {/* Section header + aggregate */}
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-text-dark uppercase tracking-wider">
          Ratings &amp; Reviews
        </h4>
        {avgRating && (
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1">
            <span className="text-amber-500 text-xs">★</span>
            <span className="text-xs font-black text-amber-700">{avgRating}</span>
            <span className="text-[9px] text-amber-600 font-medium">/ 5 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* My existing review (view mode) */}
      {myReview && !editMode && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-primary uppercase tracking-wider">Your Review</span>
            <div className="flex gap-2">
              <button onClick={() => setEditMode(true)} className="text-[9px] font-bold text-primary underline">Edit</button>
              <button onClick={handleDelete} className="text-[9px] font-bold text-red-400 underline">Delete</button>
            </div>
          </div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ color: s <= myReview.rating ? '#f59e0b' : '#d1d5db', fontSize:'14px' }}>★</span>
            ))}
          </div>
          {myReview.comment && <p className="text-[10.5px] text-text-medium leading-relaxed">"{myReview.comment}"</p>}
          {myReview.verified && <span className="text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">✓ Verified Purchase</span>}
        </div>
      )}

      {/* Write / Edit review form */}
      {user && showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2.5">
          <p className="text-[10px] font-black text-text-dark">
            {editMode ? 'Edit your review' : 'Share your experience'}
          </p>

          {/* Star selector */}
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => { setMyRating(s); setSubmitErr(''); }}
                style={{
                  fontSize: '22px',
                  lineHeight: 1,
                  color: s <= (hoverRating || myRating) ? '#f59e0b' : '#d1d5db',
                  transition: 'color 0.1s',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                ★
              </button>
            ))}
            {myRating > 0 && (
              <span className="text-[10px] text-amber-600 font-bold self-center ml-1">
                {['','Poor','Fair','Good','Very Good','Excellent'][myRating]}
              </span>
            )}
          </div>

          {/* Review text */}
          <textarea
            rows={2}
            placeholder="What did you like about this product?"
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary text-text-dark resize-none"
          />

          {submitErr && <p className="text-[10px] text-red-500 font-bold">{submitErr}</p>}
          {submitMsg && <p className="text-[10px] text-text-success font-black">{submitMsg}</p>}

          <div className="flex gap-2">
            {editMode && (
              <button onClick={() => { setEditMode(false); setMyRating(myReview?.rating||0); setReviewText(myReview?.comment||''); }}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-[10px] font-bold text-text-muted bg-white">
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting || myRating < 1}
              className="flex-1 py-2 rounded-xl text-[10px] font-black text-white transition"
              style={{
                background: (submitting || myRating < 1) ? '#e5e7eb' : 'linear-gradient(135deg,#0B6F3A,#14a857)',
                color: (submitting || myRating < 1) ? '#9ca3af' : '#fff',
                cursor: (submitting || myRating < 1) ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : (editMode ? 'Save Changes' : 'Submit Review')}
            </button>
          </div>
        </div>
      )}

      {/* Not logged in nudge */}
      {!user && (
        <p className="text-[10px] text-text-muted text-center py-1">Log in to write a review.</p>
      )}

      {/* All reviews list */}
      <div className="space-y-2.5">
        {reviews.length === 0 ? (
          <div className="text-center py-3">
            <div className="flex gap-0.5 justify-center mb-1">
              {[1,2,3,4,5].map(s => <span key={s} style={{ color:'#d1d5db', fontSize:'16px' }}>★</span>)}
            </div>
            <p className="text-[10px] text-text-muted font-semibold">No reviews yet</p>
            <p className="text-[9.5px] text-text-muted mt-0.5">Be the first to review this product.</p>
          </div>
        ) : (
          reviews.filter(r => !myReview || r.id !== myReview.id).map(r => (
            <div key={r.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : '#d1d5db', fontSize:'12px' }}>★</span>
                  ))}
                </div>
                <span className="text-[9px] text-text-muted">{fmtRelTime(r.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-text-dark">{r.userName || 'Customer'}</span>
                {r.verified && (
                  <span className="text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">✓ Verified</span>
                )}
              </div>
              {r.comment && <p className="text-[10px] text-text-medium leading-relaxed">"{r.comment}"</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Wishlist Screen ─────────────────────────────────────────────────────────
function WishlistScreen({ wishlistedIds, toggleWishlist, products, cart, updateCartQty, setSelectedProductDetails, setActiveTab }) {
  const liked = products.filter(p => wishlistedIds.has(p.id));

  if (liked.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center" style={{ minHeight: '60vh' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>♡</div>
        <h2 className="text-base font-black text-text-dark mb-1">Your Wishlist is Empty</h2>
        <p className="text-xs text-text-muted mb-6 leading-relaxed">
          Tap the ♡ on any product to save it here for later.
        </p>
        <button onClick={() => setActiveTab('home')}
          className="bg-primary text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-sm active-scale">
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-8 space-y-3">
      <div>
        <h2 className="text-base font-black text-text-dark uppercase tracking-wider">My Wishlist</h2>
        <p className="text-[10px] text-text-muted mt-0.5">{liked.length} saved item{liked.length !== 1 ? 's' : ''}</p>
      </div>

      {liked.map(product => {
        const qty = cart[product.id] || 0;
        const discountPercent = product.mrp > product.price
          ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
        const starRating = product.id
          ? Math.min(5, parseFloat((3.5 + ((product.id.charCodeAt(product.id.length - 1) % 15) / 10)).toFixed(1)))
          : 4.2;

        return (
          <div key={product.id}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="flex gap-3 p-3">
              {/* Image */}
              <div onClick={() => setSelectedProductDetails(product)}
                className="cursor-pointer flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center"
                style={{ width: '80px', height: '80px', border: '1px solid #f0f0f0' }}>
                <img src={getProductImage(product.name, product.images)} alt={product.name}
                  className="max-w-full max-h-full object-contain p-1"
                  onError={e => { e.target.src = '/logo.png'; }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    {product.brand && <span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' }}>{product.brand}</span>}
                    <p onClick={() => setSelectedProductDetails(product)}
                      className="cursor-pointer text-xs font-bold text-text-dark leading-tight mt-0.5 line-clamp-2">
                      {product.name}
                    </p>
                  </div>
                  {/* Unlike button */}
                  <button onClick={e => toggleWishlist(product.id, e)}
                    className="flex-shrink-0 btn-press"
                    style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Remove from wishlist">
                    <span style={{ fontSize: '18px', color: '#EE4224', lineHeight: 1 }}>♥</span>
                  </button>
                </div>

                {/* Unit + Rating */}
                <div className="flex items-center gap-2 mt-1">
                  {product.unit && <span style={{ fontSize: '9px', color: '#aaa', fontWeight: '500' }}>{product.unit}</span>}
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5"
                    style={{ background: '#f0faf4', borderRadius: '6px', border: '1px solid #c8ecd6' }}>
                    <span style={{ color: '#f59e0b', fontSize: '9px' }}>★</span>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: '#1B5E20' }}>{starRating}</span>
                  </div>
                  {product.stock === 0 && (
                    <span style={{ fontSize: '8px', fontWeight: '700', color: '#EE4224', background: '#fef2f2', padding: '1px 5px', borderRadius: '5px' }}>Out of Stock</span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a' }}>₹{product.price}</span>
                  {product.mrp > product.price && (
                    <span style={{ fontSize: '10px', color: '#bbb', textDecoration: 'line-through' }}>₹{product.mrp}</span>
                  )}
                  {discountPercent > 0 && (
                    <span style={{ fontSize: '9px', fontWeight: '700', color: '#0B6F3A' }}>{discountPercent}% off</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 px-3 pb-3">
              {qty > 0 ? (
                <div className="flex items-center overflow-hidden flex-1"
                  style={{ background: 'linear-gradient(135deg,#0B6F3A,#14a857)', borderRadius: '10px', boxShadow: '0 2px 8px rgba(11,111,58,0.3)' }}>
                  <button onClick={() => updateCartQty(product.id, -1)} className="btn-press flex items-center justify-center"
                    style={{ width: '36px', height: '32px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>−</button>
                  <span style={{ color: '#fff', fontWeight: '800', fontSize: '13px', flex: 1, textAlign: 'center' }}>{qty}</span>
                  <button onClick={() => updateCartQty(product.id, 1)} className="btn-press flex items-center justify-center"
                    style={{ width: '36px', height: '32px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>+</button>
                </div>
              ) : (
                <button disabled={product.stock === 0}
                  onClick={() => product.stock > 0 && updateCartQty(product.id, 1)}
                  className="btn-press flex-1 flex items-center justify-center gap-1 text-xs font-bold"
                  style={{ height: '32px', borderRadius: '10px', border: product.stock === 0 ? '1.5px solid #ddd' : '1.5px solid #0B6F3A', background: '#fff', color: product.stock === 0 ? '#bbb' : '#0B6F3A', cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}>
                  Add to Basket
                </button>
              )}
              <button disabled={product.stock === 0}
                onClick={() => { if (product.stock === 0) return; if (qty === 0) updateCartQty(product.id, 1); setActiveTab('checkout'); }}
                className="btn-press flex-1 flex items-center justify-center text-xs font-bold text-white"
                style={{ height: '32px', borderRadius: '10px', background: product.stock === 0 ? '#e5e7eb' : 'linear-gradient(135deg,#0B6F3A,#14a857)', color: product.stock === 0 ? '#9ca3af' : '#fff', border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}>
                Buy Now
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── My Orders Screen (proper React component — no hooks-in-IIFE) ─────────────
const ORDER_STATUS_COLORS = {
  'Placed':           { color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE' },
  'Confirmed':        { color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE' },
  'Packed':           { color:'#B45309', bg:'#FFFBEB', border:'#FDE68A' },
  'Out for Delivery': { color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC' },
  'Delivered':        { color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
  'Cancelled':        { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
};

function fmtOrderDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    + ' · ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

function MyOrdersScreen({ userOrders, viewOrder, setViewOrder, setTrackingOrderId, setActiveTab }) {
  return (
    <div className="p-4 pb-8 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-black text-text-dark uppercase tracking-wider">My Orders</h2>
        {userOrders.length > 0 && (
          <p className="text-[10px] text-text-muted mt-0.5">
            {userOrders.length} order{userOrders.length !== 1 ? 's' : ''} · newest first
          </p>
        )}
      </div>

      {/* Empty state */}
      {userOrders.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-premium space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto">
            <ClipboardList size={28} className="text-gray-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-dark">No orders yet</h3>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
              Your orders will appear here after you make your first purchase.
            </p>
          </div>
          <button onClick={() => setActiveTab('home')}
            className="bg-primary text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-sm active-scale inline-flex items-center gap-1.5">
            <ShoppingCart size={13} strokeWidth={2.5} /> Start Shopping
          </button>
        </div>
      )}

      {/* Order cards */}
      {userOrders.map(order => {
        const sc = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS['Placed'];
        const items = (order.items || []);
        const summary = order.summary || {};
        return (
          <div key={order.id} className="bg-white rounded-2xl shadow-premium overflow-hidden"
            style={{ border:`1.5px solid ${sc.border}` }}>
            {/* Status strip */}
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background:sc.bg, borderBottom:`1px solid ${sc.border}` }}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color:sc.color }}>
                  {order.orderNumber || `#${(order.id||'').slice(-8).toUpperCase()}`}
                </p>
                <p className="text-[9px] text-text-muted mt-0.5">{fmtOrderDate(order.createdAt)}</p>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{ color:sc.color, background:'#fff', border:`1.5px solid ${sc.color}` }}>
                ● {order.status}
              </span>
            </div>
            {/* Items preview */}
            <div className="px-4 py-3 space-y-2.5">
              {items.slice(0, 2).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                    <img src={item.image || getProductImage(item.name || '', [])} alt={item.name || ''}
                      className="w-full h-full object-cover" onError={e => { e.target.src='/logo.png'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-dark truncate">{item.name || '—'}</p>
                    <p className="text-[10px] text-text-muted">{item.unit ? `${item.unit} · ` : ''}Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <span className="text-xs font-black text-text-success flex-shrink-0">
                    ₹{((item.price || 0) * (item.quantity || 0)).toFixed(0)}
                  </span>
                </div>
              ))}
              {items.length > 2 && (
                <p className="text-[10px] text-text-muted text-center font-semibold">
                  +{items.length - 2} more item{items.length - 2 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-text-muted uppercase font-bold tracking-wide">{order.paymentMethod || 'COD'}</p>
                <p className="text-sm font-black text-text-dark">₹{summary.grandTotal || '—'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setTrackingOrderId(order.id); setActiveTab('tracking'); }}
                  className="btn-press text-[10px] font-bold px-3 py-1.5 rounded-xl border"
                  style={{ color:sc.color, borderColor:sc.border, background:sc.bg }}>
                  Track
                </button>
                <button onClick={() => setViewOrder(order)}
                  className="btn-press text-[10px] font-bold px-3 py-1.5 rounded-xl text-white"
                  style={{ background:'linear-gradient(135deg,#0B6F3A,#14a857)', boxShadow:'0 2px 8px rgba(11,111,58,0.3)' }}>
                  View Order
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* View Order Detail Sheet */}
      {viewOrder && (
        <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-50 animate-fade-in"
          onClick={() => setViewOrder(null)}>
          <div className="bg-white rounded-t-3xl w-full animate-slide-up shadow-2xl"
            style={{ maxHeight:'88vh', display:'flex', flexDirection:'column' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3" />
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Order Details</p>
                  <h3 className="text-sm font-black text-text-dark">
                    {viewOrder.orderNumber || `#${(viewOrder.id||'').slice(-8).toUpperCase()}`}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                    style={{
                      color: (ORDER_STATUS_COLORS[viewOrder.status] || ORDER_STATUS_COLORS['Placed']).color,
                      background: (ORDER_STATUS_COLORS[viewOrder.status] || ORDER_STATUS_COLORS['Placed']).bg,
                      border: `1px solid ${(ORDER_STATUS_COLORS[viewOrder.status] || ORDER_STATUS_COLORS['Placed']).border}`,
                    }}>
                    {viewOrder.status}
                  </span>
                  <button onClick={() => setViewOrder(null)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-black">✕</button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
              {/* Order meta */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[9px] text-text-muted uppercase font-bold tracking-wide mb-1">Order Date</p>
                  <p className="text-xs font-bold text-text-dark">{fmtOrderDate(viewOrder.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[9px] text-text-muted uppercase font-bold tracking-wide mb-1">Payment</p>
                  <p className="text-xs font-bold text-text-dark">{viewOrder.paymentMethod || 'COD'}</p>
                  <p className="text-[9px] text-amber-600 font-bold mt-0.5">{viewOrder.paymentStatus || 'Pending'}</p>
                </div>
              </div>
              {/* Products */}
              <div>
                <h4 className="text-[10px] font-black text-text-dark uppercase tracking-wider mb-2">Products</h4>
                <div className="space-y-2">
                  {(viewOrder.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                        <img src={item.image || getProductImage(item.name || '', [])} alt={item.name || ''}
                          className="w-full h-full object-cover" onError={e => { e.target.src='/logo.png'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-dark truncate">{item.name || '—'}</p>
                        <p className="text-[10px] text-text-muted">{item.unit ? `${item.unit} · ` : ''}Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                      <span className="text-xs font-black text-text-success flex-shrink-0">
                        ₹{((item.price || 0) * (item.quantity || 0)).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Delivery */}
              <div>
                <h4 className="text-[10px] font-black text-text-dark uppercase tracking-wider mb-2">Delivery Details</h4>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs">
                  {(viewOrder.address?.name || viewOrder.customerName) && <p className="font-bold text-text-dark">{viewOrder.address?.name || viewOrder.customerName}</p>}
                  {(viewOrder.address?.phone || viewOrder.customerPhone) && <p className="text-text-muted">📞 {viewOrder.address?.phone || viewOrder.customerPhone}</p>}
                  {viewOrder.address?.addressText && <p className="text-text-muted leading-relaxed">📍 {viewOrder.address.addressText}</p>}
                  {viewOrder.pincode && <p className="text-text-muted">Pincode: {viewOrder.pincode}</p>}
                  {viewOrder.deliverySlot && <p className="text-text-muted">🕐 {viewOrder.deliverySlot}</p>}
                </div>
              </div>
              {/* Payment summary */}
              <div>
                <h4 className="text-[10px] font-black text-text-dark uppercase tracking-wider mb-2">Payment Summary</h4>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted font-medium">Subtotal</span>
                    <span className="font-bold text-text-dark">₹{viewOrder.summary?.itemTotal ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted font-medium">Delivery Fee</span>
                    <span className={`font-bold ${viewOrder.summary?.deliveryFee === 0 ? 'text-text-success' : 'text-text-dark'}`}>
                      {viewOrder.summary?.deliveryFee === 0 ? 'Free' : `₹${viewOrder.summary?.deliveryFee ?? '—'}`}
                    </span>
                  </div>
                  {(viewOrder.summary?.savings > 0) && (
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted font-medium">Savings</span>
                      <span className="font-bold text-text-success">-₹{viewOrder.summary.savings}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center">
                    <span className="text-xs font-black text-text-dark">Grand Total</span>
                    <span className="text-sm font-black text-primary">₹{viewOrder.summary?.grandTotal ?? '—'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setViewOrder(null); setTrackingOrderId(viewOrder.id); setActiveTab('tracking'); }}
                className="w-full py-3 rounded-xl text-sm font-bold text-white active-scale"
                style={{ background:'linear-gradient(135deg,#0B6F3A,#14a857)', boxShadow:'0 4px 14px rgba(11,111,58,0.3)' }}>
                Track This Order →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
  const [productDetailsAddedMsg, setProductDetailsAddedMsg] = useState(false);
  // Tracks the user-selected variant/size chip inside the product details sheet
  const [detailsVariant, setDetailsVariant] = useState('');

  // Reset selected variant whenever a new product is opened
  useEffect(() => {
    if (selectedProductDetails) {
      const vList = selectedProductDetails.variants
        ? selectedProductDetails.variants.split(',').map(v => v.trim()).filter(Boolean)
        : [];
      setDetailsVariant(vList.length > 0 ? vList[0] : (selectedProductDetails.unit || ''));
    }
  }, [selectedProductDetails]);

  // ── Wishlist (persisted per-user in localStorage) ──────────────────────────
  const wishlistKey = user ? `ushamart_wishlist_${user.uid || user.phone}` : null;
  const [wishlistedIds, setWishlistedIds] = useState(() => {
    try {
      if (!wishlistKey) return new Set();
      const stored = localStorage.getItem(wishlistKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Re-load wishlist when user changes (login/logout)
  useEffect(() => {
    if (!wishlistKey) { setWishlistedIds(new Set()); return; }
    try {
      const stored = localStorage.getItem(wishlistKey);
      setWishlistedIds(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch { setWishlistedIds(new Set()); }
  }, [wishlistKey]);

  const toggleWishlist = (productId, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!wishlistKey) return;
    setWishlistedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) { next.delete(productId); } else { next.add(productId); }
      localStorage.setItem(wishlistKey, JSON.stringify([...next]));
      return next;
    });
  };

  // Voice search handler
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Voice search is not supported in this browser.');
      setTimeout(() => setVoiceError(''), 3000);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    setVoiceError('');
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setActiveTab('home');
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setVoiceError('Microphone permission denied.');
      } else {
        setVoiceError('Could not hear you. Try again.');
      }
      setTimeout(() => setVoiceError(''), 3000);
    };
    recognition.onend = () => setIsListening(false);
  };

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
    // Splash duration is controlled by SplashScreen component itself via onFinish callback
    // Keeping this as a safety fallback in case SplashScreen unmounts unexpectedly
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Database Synchronized States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [serviceablePincodes, setServiceablePincodes] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Offer-products screen — populated when user taps a multi-product offer
  const [offerProductIds, setOfferProductIds] = useState([]);
  const [offerProductsTitle, setOfferProductsTitle] = useState('');

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
  const [viewOrder, setViewOrder] = useState(null); // for My Orders detail modal

  // Auth Gate
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authStep, setAuthStep] = useState(1); // 1 = Phone Input, 2 = OTP Input
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // ── Profile form state ────────────────────────────────────────────────────
  // showProfileForm: true → show "Complete Your Profile" full-screen overlay
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileName,     setProfileName]     = useState('');
  const [profileEmail,    setProfileEmail]    = useState('');
  const [profileDob,      setProfileDob]      = useState('');
  const [profileGender,   setProfileGender]   = useState('');
  const [profilePic,      setProfilePic]      = useState('');
  const [profileHouse,    setProfileHouse]    = useState('');
  const [profileStreet,   setProfileStreet]   = useState('');
  const [profileArea,     setProfileArea]     = useState('');
  const [profileLandmark, setProfileLandmark] = useState('');
  const [profileCity,     setProfileCity]     = useState('');
  const [profileState,    setProfileState]    = useState('');
  const [profilePincode,  setProfilePincode]  = useState('');
  const [profileSaving,   setProfileSaving]   = useState(false);
  const [profileFormErr,  setProfileFormErr]  = useState('');
  // Edit-profile mode (shown inside the profile tab for already-saved profiles)
  const [editingProfile,  setEditingProfile]  = useState(false);

  // Active Carousel Index
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Header category chip quick-filter
  const [activeChip, setActiveChip] = useState('All');

  // Voice search
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  // Show all categories toggle
  const [showAllCategories, setShowAllCategories] = useState(false);

  const publishedCategories = categories.filter(c => c.status === 'published');

  // No auto-login — user must sign in manually. Guest state is user === null.

  // ── Helper: load saved profile fields into local state ───────────────────
  const loadProfileFromDbUser = (dbUser) => {
    setProfileName(dbUser.name        || '');
    setProfileEmail(dbUser.email       || '');
    setProfileDob(dbUser.dob          || '');
    setProfileGender(dbUser.gender    || '');
    setProfilePic(dbUser.profilePic   || '');
    setProfileHouse(dbUser.house      || '');
    setProfileStreet(dbUser.street    || '');
    setProfileArea(dbUser.area        || '');
    setProfileLandmark(dbUser.landmark|| '');
    setProfileCity(dbUser.city        || '');
    setProfileState(dbUser.state      || '');
    setProfilePincode(dbUser.pincode  || '');
  };

  // Populate profile states whenever the user session changes (e.g. page refresh)
  useEffect(() => {
    if (user && user.phone) {
      loadProfileFromDbUser(user);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

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
    const unsubSpecialOffers = db.collection('special_offers').onSnapshot((data) => {
      setSpecialOffers(data);
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
      unsubSpecialOffers();
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
    if (user && user.addressText && !deliveryAddress.name) {
      const loadedAddress = {
        name: user.name || '',
        phone: user.phone || '',
        addressText: user.addressText || ''
      };
      setDeliveryAddress(loadedAddress);
      setTempAddress(loadedAddress);
    }
  }, [user?.uid, user?.addressText]); // re-run when profile is saved

  // Update user orders in real-time when logged in
  useEffect(() => {
    if (!user) {
      setUserOrders([]);
      return;
    }
    const unsubOrders = db.collection('orders').onSnapshot((data) => {
      const myPhone = user.phone || '';
      const myUid   = user.uid   || '';
      const filtered = data
        .filter(order => {
          // Match by phone (stored in address.phone or denormalised customerPhone)
          const orderPhone = order.address?.phone || order.customerPhone || '';
          const orderUid   = order.userId || '';
          return orderPhone === myPhone || (myUid && orderUid === myUid);
        })
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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

  // Auto-scroll special-offers carousel (paused externally via carouselPaused flag)
  const [carouselPaused, setCarouselPaused] = useState(false);
  useEffect(() => {
    // Build the display list the same way the render does:
    // active special_offers if any, otherwise 3 fallbacks
    const now = Date.now();
    const activeOffers = specialOffers.filter(o => {
      if (o.status !== 'active' && o.active !== true) return false;
      if (o.endDate   && new Date(o.endDate).getTime()   < now) return false;
      if (o.startDate && new Date(o.startDate).getTime() > now) return false;
      return true;
    }).sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    const total = activeOffers.length > 0 ? activeOffers.length : 3; // 3 fallbacks
    if (total <= 1) return;
    if (carouselPaused) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % total);
    }, 4500);
    return () => clearInterval(interval);
  }, [specialOffers, carouselPaused]);

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

  // ── Save profile (new user first-time / returning user edit) ───────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileFormErr('');
    if (!profileName.trim()) { setProfileFormErr('Full name is required.'); return; }
    if (!profileHouse.trim() || !profileCity.trim() || !profileState.trim() || !profilePincode.trim()) {
      setProfileFormErr('House number, city, state and pincode are required.');
      return;
    }
    if (profilePincode.length !== 6 || !/^\d{6}$/.test(profilePincode)) {
      setProfileFormErr('Pincode must be exactly 6 digits.');
      return;
    }
    setProfileSaving(true);
    try {
      const addressText = [profileHouse, profileStreet, profileArea, profileLandmark, profileCity, profileState, profilePincode]
        .filter(Boolean).join(', ');

      const updated = {
        name:            profileName.trim(),
        email:           profileEmail.trim(),
        dob:             profileDob,
        gender:          profileGender,
        profilePic:      profilePic,
        house:           profileHouse.trim(),
        street:          profileStreet.trim(),
        area:            profileArea.trim(),
        landmark:        profileLandmark.trim(),
        city:            profileCity.trim(),
        state:           profileState.trim(),
        pincode:         profilePincode.trim(),
        addressText,
        needProfileUpdate: false,
        updatedAt:       Date.now(),
      };

      // Find the user's record in the DB by phone
      const usersList = await db.collection('users').get();
      const dbRecord  = usersList.find(u => u.phone === user.phone);
      if (dbRecord) {
        await db.collection('users').update(dbRecord.id, updated);
      } else {
        await db.collection('users').add({ ...user, ...updated });
      }

      // Update session
      const updatedSession = { ...user, ...updated };
      localStorage.setItem('ushamart_user', JSON.stringify(updatedSession));
      setUser(updatedSession);

      // Sync delivery address used in header / checkout
      setDeliveryAddress({ name: updated.name, phone: user.phone, addressText });
      setTempAddress(   { name: updated.name, phone: user.phone, addressText });

      // Update active pincode if changed
      if (profilePincode && profilePincode !== pincode) {
        setPincode(profilePincode);
        localStorage.setItem('ushamart_active_pincode', profilePincode);
      }

      setShowProfileForm(false);
      setEditingProfile(false);
      // First-time profile completion → take user to home
      if (!editingProfile) setActiveTab('home');
    } catch (err) {
      console.error('[handleSaveProfile]', err);
      setProfileFormErr('Failed to save profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
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
        // Check if phone is blocked
        const usersList = await db.collection('users').get();
        const matchedDbUser = usersList.find(u => u.phone === authPhone);

        if (matchedDbUser && matchedDbUser.status === 'blocked') {
          setAuthError('Your account has been blocked. Please contact UshaMart support.');
          setIsAuthLoading(false);
          return;
        }

        const userObj = await auth.signInWithPhone(authPhone);
        const now = Date.now();

        if (matchedDbUser) {
          // ── Returning user ─────────────────────────────────────────────
          const fullUserObj = {
            ...userObj,
            ...matchedDbUser,
            needProfileUpdate: !matchedDbUser.name, // still incomplete if no name
          };
          localStorage.setItem('ushamart_user', JSON.stringify(fullUserObj));
          setUser(fullUserObj);
          loadProfileFromDbUser(matchedDbUser);

          // Update lastLogin
          await db.collection('users').update(matchedDbUser.id, {
            lastLogin: now,
            pincode: localStorage.getItem('ushamart_active_pincode') || matchedDbUser.pincode || '',
          });

          setIsAuthModalOpen(false);
          setAuthPhone('');
          setAuthOtp('');
          setAuthStep(1);

          // If profile is incomplete, show the complete-profile overlay
          if (!matchedDbUser.name) {
            setShowProfileForm(true);
            setActiveTab('profile');
          }
        } else {
          // ── New user ───────────────────────────────────────────────────
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
            needProfileUpdate: true,
          };
          const added = await db.collection('users').add(newDbUser);
          // Use the id returned by add() so we can update the record later
          const newUserWithId = { ...newDbUser, id: added?.id || newDbUser.uid };
          localStorage.setItem('ushamart_user', JSON.stringify(newUserWithId));
          setUser(newUserWithId);

          setIsAuthModalOpen(false);
          setAuthPhone('');
          setAuthOtp('');
          setAuthStep(1);

          // Show complete-profile overlay immediately
          setShowProfileForm(true);
          setActiveTab('profile');
        }
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
    if (!deliveryAddress.name || !deliveryAddress.phone) {
      alert('Please enter your name and phone number before placing the order.');
      setIsAddressModalOpen(true);
      return;
    }

    const totals     = getCartTotals();
    const cartSnap   = { ...cart };                           // snapshot so cart clear is safe
    const orderItems = Object.entries(cartSnap).map(([prodId, qty]) => {
      const prod = products.find(p => p.id === prodId);
      if (!prod) return null;
      return {
        productId: prodId,
        quantity:  qty,
        price:     prod.price,
        mrp:       prod.mrp || prod.price,
        name:      prod.name,
        unit:      prod.unit || '',
        image:     getProductImage(prod.name, prod.images),
      };
    }).filter(Boolean);

    // Generate human-readable order number: UM-YYYY-XXXX
    const year       = new Date().getFullYear();
    const existingOrders = (function() {
      try { return JSON.parse(localStorage.getItem('ushamart_db_orders') || '[]'); } catch { return []; }
    })();
    const seq        = String(existingOrders.length + 1).padStart(4, '0');
    const orderNumber = `UM-${year}-${seq}`;

    const newOrder = {
      orderNumber,
      // Customer denormalised fields so admin can search without joining
      customerName:  deliveryAddress.name  || user.name  || '',
      customerPhone: deliveryAddress.phone || user.phone || '',
      userId:        user.uid || user.phone || '',
      // Core order data
      pincode,
      items:         orderItems,
      summary:       totals,
      deliverySlot:  selectedSlot,
      address:       deliveryAddress,
      paymentMethod,
      paymentStatus: 'Pending',
      status:        'Pending',
      couponCode:    appliedCoupon ? appliedCoupon.code : null,
      createdAt:     Date.now(),
      updatedAt:     Date.now(),
    };

    // Do NOT clear the cart until the write succeeds
    try {
      console.log('[UshaMart] Placing order:', newOrder);
      const created = await db.collection('orders').add(newOrder);
      console.log('[UshaMart] Order saved with id:', created.id, '| orderNumber:', orderNumber);

      // Reduce product stock after confirmed save
      for (const item of orderItems) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          await db.collection('products').update(prod.id, {
            stock: Math.max(0, prod.stock - item.quantity),
          });
        }
      }

      // Only clear cart AFTER successful order creation
      setCart({});
      setAppliedCoupon(null);
      setCouponCodeInput('');
      setSelectedSlot('');
      setTrackingOrderId(created.id);
      setActiveTab('tracking');
    } catch (e) {
      console.error('[UshaMart] Order placement failed:', e);
      alert('Order placement failed: ' + (e?.message || 'Unknown error') + '\n\nYour cart has been kept. Please try again.');
      // Cart is NOT cleared — user retains their items
    }
  };

  // Splash Loading Screen
  if (showSplash) {
    return (
      <SplashScreen onFinish={() => setShowSplash(false)} />
    );
  }

  // ONBOARDING 1: Register / Login screen
  // Guest users CAN browse the home page — login is only required for checkout/orders/profile
  // (No early return for !user — handled inside each screen that needs auth)

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

        {/* Heart / Wishlist — top-right */}
        <button
          onClick={e => toggleWishlist(product.id, e)}
          className="absolute top-1.5 right-1.5 z-20 btn-press"
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: wishlistedIds.has(product.id) ? '#fff0f0' : 'rgba(255,255,255,0.85)',
            border: `1px solid ${wishlistedIds.has(product.id) ? '#fca5a5' : '#e5e7eb'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer', fontSize: '13px', lineHeight: 1,
            transition: 'all 0.2s ease',
          }}
          aria-label={wishlistedIds.has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlistedIds.has(product.id) ? '♥' : '♡'}
        </button>

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

      {/* ── NEW PREMIUM WHITE HEADER ── */}
      <div className="z-20 flex-shrink-0 bg-white" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>

        {/* Row 1: Logo + Icons */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          {/* Logo */}
          <div className="flex items-center gap-2 select-none">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '2px solid #0B6F3A',
                padding: '3px',
                boxShadow: '0 2px 8px rgba(11,111,58,0.18)',
                overflow: 'hidden',
              }}
            >
              <img
                src="/logo.png"
                alt="UshaMart"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <div className="leading-none">
              <span style={{ fontSize: '17px', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                Usha<span style={{ color: '#0B6F3A' }}>Mart</span>
              </span>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <button onClick={() => setActiveTab('wishlist')} className="relative btn-press" aria-label="Wishlist">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f5f5f7', border: '1px solid #ebebeb' }}>
                <span style={{ fontSize: '16px', color: wishlistedIds.size > 0 ? '#EE4224' : '#6b7280', lineHeight: 1 }}>
                  {wishlistedIds.size > 0 ? '♥' : '♡'}
                </span>
              </div>
              {wishlistedIds.size > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: '#EE4224' }}>
                  {wishlistedIds.size > 9 ? '9+' : wishlistedIds.size}
                </span>
              )}
            </button>

            {/* Notifications */}
            <button onClick={() => setActiveTab('profile')} className="relative btn-press" aria-label="Notifications">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f5f5f7', border: '1px solid #ebebeb' }}>
                <Bell size={16} style={{ color: '#6b7280' }} strokeWidth={2} />
              </div>
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: '#EE4224' }}>
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button onClick={() => setActiveTab('cart')} className="relative btn-press" aria-label="Cart">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f5f5f7', border: '1px solid #ebebeb' }}>
                <ShoppingCart size={16} style={{ color: '#6b7280' }} strokeWidth={2} />
              </div>
              {getCartItemsCount() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: '#EE4224' }}>
                  {getCartItemsCount() > 9 ? '9+' : getCartItemsCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Delivery info */}
        <div className="flex items-center gap-0 px-4 pb-2.5">
          {/* Location */}
          <button
            onClick={() => { setPincodeInput(pincode); setPincodeModalError(''); setShowPincodeModal(true); }}
            className="flex items-center gap-1.5 flex-1 min-w-0 btn-press"
          >
            <MapPin size={13} strokeWidth={2.5} style={{ color: '#7c3aed', flexShrink: 0 }} />
            <div className="min-w-0 text-left">
              <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500', display: 'block', lineHeight: '1' }}>Deliver to</span>
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className="truncate" style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a1a', maxWidth: '130px', display: 'inline-block' }}>
                  {deliveryAddress.addressText
                    ? deliveryAddress.addressText.split(',').slice(0, 2).join(',').trim()
                    : `Pincode: ${pincode}`}
                </span>
                <ChevronDown size={11} strokeWidth={2.5} style={{ color: '#7c3aed', flexShrink: 0 }} />
              </div>
            </div>
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: '#e5e7eb', flexShrink: 0, margin: '0 10px' }} />

          {/* Delivery time */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <span style={{ fontSize: '14px' }}>🚚</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500', display: 'block', lineHeight: '1' }}>Earliest Delivery</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', display: 'block', marginTop: '1px' }}>
                {activePincodeConfig?.time || 'Tomorrow • 6–9 AM'}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Search bar with mic */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ background: '#f5f5f7', borderRadius: '14px', border: '1.5px solid #ebebeb' }}>
            <Search size={16} style={{ color: '#9ca3af', flexShrink: 0 }} strokeWidth={2} />
            <input
              type="text"
              placeholder="Search groceries, fruits, snacks..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if (activeTab !== 'home') setActiveTab('home'); }}
              className="flex-1 bg-transparent text-gray-800 text-[13px] font-medium focus:outline-none"
              style={{ minWidth: 0, color: '#1a1a1a' }}
            />
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="btn-press w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#ddd' }}>
                <X size={10} style={{ color: '#555' }} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                onClick={startVoiceSearch}
                className={`btn-press flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isListening ? 'mic-listening' : ''}`}
                style={{ background: isListening ? '#7c3aed' : 'linear-gradient(135deg,#7c3aed,#9d5cf6)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}
                aria-label="Voice search"
              >
                <span style={{ fontSize: '14px', lineHeight: 1 }}>{isListening ? '🔴' : '🎙️'}</span>
              </button>
            )}
          </div>
          {voiceError && (
            <p style={{ fontSize: '11px', color: '#EE4224', fontWeight: '600', marginTop: '4px', paddingLeft: '4px' }}>{voiceError}</p>
          )}
        </div>
      </div>

      {/* Screen Views Wrapper */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20" style={{ background: '#f7f7fb' }}>

        {/* ══ SCREEN 2: NEW PREMIUM HOME ══ */}
        {activeTab === 'home' && (
          <div className="pb-4 page-enter" style={{ background: '#f7f7fb', minHeight: '100%' }}>

            {/* ── SPECIAL OFFERS CAROUSEL ── */}
            {(() => {
              // ── helpers ──────────────────────────────────────────────────
              const navigateOffer = (offer) => {
                if (!offer || offer.isFallback) { setActiveTab('categories'); return; }
                const type = offer.offerType || offer.destinationType || 'general';
                if (type === 'category' && offer.linkedCatId) {
                  setSelectedCategory(offer.linkedCatId);
                  setActiveTab('categories');
                } else if (type === 'product' && offer.linkedProdId) {
                  const prod = products.find(p => p.id === offer.linkedProdId);
                  if (prod) { setSelectedProductDetails(prod); } else { setActiveTab('categories'); }
                } else if (type === 'multi' && offer.multiProdIds?.length > 0) {
                  setOfferProductIds(offer.multiProdIds);
                  setOfferProductsTitle(offer.title || 'Offer Products');
                  setActiveTab('offer_products');
                } else {
                  setActiveTab('categories');
                }
              };

              // ── build display list ────────────────────────────────────────
              const FALLBACK_OFFERS = [
                { id:'fb1', title:'Healthy Snack Week', subtitle:'Good choices. Better everyday moments.', badgeText:'UP TO 30% OFF', buttonText:'SHOP NOW →', bgColor:'#ede9fe', textColor:'#4c1d95', btnBg:'#7c3aed', btnColor:'#fff', imageUrl:'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&q=80', isFallback:true },
                { id:'fb2', title:'Fresh Picks Today',  subtitle:'Farm-fresh produce at your door.',       badgeText:'EXPRESS DELIVERY', buttonText:'ORDER NOW →', bgColor:'#dcfce7', textColor:'#14532d', btnBg:'#16a34a', btnColor:'#fff', imageUrl:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', isFallback:true },
                { id:'fb3', title:'Kids Snack Corner',  subtitle:'Tasty little treats for happy moments.', badgeText:'SPECIAL PICKS',   buttonText:'EXPLORE →',   bgColor:'#fef3c7', textColor:'#78350f', btnBg:'#d97706', btnColor:'#fff', imageUrl:'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', isFallback:true },
              ];
              const now = Date.now();
              const activeOffers = specialOffers
                .filter(o => {
                  if (o.status !== 'active' && o.active !== true) return false;
                  if (o.endDate   && new Date(o.endDate).getTime()   < now) return false;
                  if (o.startDate && new Date(o.startDate).getTime() > now) return false;
                  return true;
                })
                .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
              const displayOffers = activeOffers.length > 0 ? activeOffers : FALLBACK_OFFERS;
              const total = displayOffers.length;
              const idx   = carouselIndex % total;
              const cur   = displayOffers[idx];

              // ── touch/swipe handlers ─────────────────────────────────────
              const handleTouchStart = (e) => {
                e._swipeX = e.touches[0].clientX;
                setCarouselPaused(true);
              };
              const handleTouchEnd = (e) => {
                const diff = e._swipeX - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 40) {
                  setCarouselIndex(prev => diff > 0
                    ? (prev + 1) % total
                    : (prev - 1 + total) % total
                  );
                }
                setTimeout(() => setCarouselPaused(false), 6000);
              };

              return (
                <div className="px-3 pt-3 pb-2">
                  <div
                    className="relative overflow-hidden"
                    style={{ borderRadius:'20px', boxShadow:'0 6px 28px rgba(0,0,0,0.10)', cursor:'pointer' }}
                    onClick={() => navigateOffer(cur)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* ── Slide content ─────────────────────────────────── */}
                    <div
                      key={cur.id}
                      className="animate-banner-slide flex items-center justify-between"
                      style={{
                        background: cur.bgColor || '#ede9fe',
                        minHeight: '160px',
                        padding: '20px 16px 20px 20px',
                      }}
                    >
                      {/* Left: text */}
                      <div className="flex-1 pr-3 z-10" style={{ minWidth: 0 }}>
                        {cur.badgeText && (
                          <span
                            className="inline-block mb-2.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full"
                            style={{ background: cur.btnBg || '#7c3aed', color: cur.btnColor || '#fff' }}
                          >
                            {cur.badgeText}
                          </span>
                        )}
                        <h2
                          className="line-clamp-2"
                          style={{ fontSize:'20px', fontWeight:'900', lineHeight:'1.15', color: cur.textColor || '#4c1d95', marginBottom:'6px' }}
                        >
                          {cur.title}
                        </h2>
                        {cur.subtitle && (
                          <p style={{ fontSize:'11px', color: cur.textColor || '#4c1d95', opacity:0.72, lineHeight:'1.45', marginBottom:'14px' }}>
                            {cur.subtitle}
                          </p>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); navigateOffer(cur); }}
                          className="btn-press px-5 py-2.5 rounded-full text-xs font-black"
                          style={{ background: cur.btnBg || '#7c3aed', color: cur.btnColor || '#fff', boxShadow:`0 4px 16px ${(cur.btnBg||'#7c3aed')}55`, border:'none' }}
                        >
                          {cur.buttonText || 'SHOP NOW →'}
                        </button>
                      </div>

                      {/* Right: image */}
                      <div
                        className="flex-shrink-0 img-zoom"
                        style={{ width:'120px', height:'120px', borderRadius:'16px', overflow:'hidden', boxShadow:'0 6px 20px rgba(0,0,0,0.13)' }}
                      >
                        <img
                          src={cur.imageUrl}
                          alt={cur.title}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src='/logo.png'; }}
                        />
                      </div>
                    </div>

                    {/* ── Pagination dots ───────────────────────────────── */}
                    {total > 1 && (
                      <div
                        className="absolute bottom-3 left-1/2 flex gap-1.5"
                        style={{ transform:'translateX(-50%)', zIndex:10 }}
                        onClick={e => e.stopPropagation()}
                      >
                        {displayOffers.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => { setCarouselIndex(i); setCarouselPaused(true); setTimeout(()=>setCarouselPaused(false),6000); }}
                            style={{
                              width:  i === idx ? '18px' : '6px',
                              height: '6px',
                              borderRadius: '3px',
                              background: i === idx ? (cur.btnBg || '#7c3aed') : 'rgba(0,0,0,0.18)',
                              transition: 'all 0.3s ease',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── SHOP BY CATEGORY ── */}
            <div className="pt-4 pb-1">
              <div className="flex items-center justify-between px-4 mb-3">
                <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#1a1a1a' }}>Shop by Category</h2>
                <button onClick={() => setShowAllCategories(v => !v)} className="btn-press flex items-center gap-1" style={{ color:'#0B6F3A', fontSize:'12px', fontWeight:'700' }}>
                  {showAllCategories ? 'Show Less' : 'See All'} <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              </div>
              {publishedCategories.length === 0 ? (
                <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
                  {[1,2,3,4,5].map(i => <div key={i} className="skeleton flex-shrink-0" style={{ width:'72px', height:'88px', borderRadius:'16px' }} />)}
                </div>
              ) : (
                <div className={showAllCategories ? 'grid grid-cols-4 gap-3 px-4' : 'flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1'} style={{ WebkitOverflowScrolling:'touch' }}>
                  {(showAllCategories ? publishedCategories : publishedCategories).map((cat, idx) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setActiveTab('categories'); }}
                      className={`cat-card btn-press flex-shrink-0 flex flex-col items-center stagger-${Math.min(idx+1,8)}`}
                      style={{ width: showAllCategories ? 'auto' : '72px' }}
                    >
                      <div style={{ width:'68px', height:'68px', borderRadius:'18px', overflow:'hidden', background:'#fff', border:'1.5px solid #f0f0f5', boxShadow:'0 2px 10px rgba(0,0,0,0.08)', marginBottom:'6px', display:'flex', alignItems:'center', justifyContent:'center', padding:'6px' }}>
                        <img src={getCategoryImage(cat.name, cat.icon)} alt={cat.name} className="w-full h-full object-cover" style={{ borderRadius:'12px' }} onError={e => { e.target.src='/logo.png'; }} />
                      </div>
                      <span style={{ fontSize:'10px', fontWeight:'700', color:'#1a1a1a', textAlign:'center', lineHeight:'1.3', maxWidth:'68px', display:'block' }} className="line-clamp-2">
                        {cat.emojiIcon ? `${cat.emojiIcon} ` : ''}{cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── PICKED FOR YOU ── */}
            {(() => {
              const allPub = products.filter(p => {
                if (p.status !== 'published') return false;
                if (!p.pincodesAvailable || p.pincodesAvailable.length === 0) return true;
                return p.pincodesAvailable.includes(pincode);
              });
              const picked = allPub.filter(p => p.featured || p.bestSeller || p.newArrival || p.trending).slice(0, 10);
              const fallback = picked.length === 0 ? allPub.slice(0, 8) : picked;
              if (fallback.length === 0) return null;
              return (
                <div className="pt-5 pb-1">
                  <div className="flex items-center justify-between px-4 mb-3">
                    <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#1a1a1a' }}>✨ Picked For You</h2>
                    <button onClick={() => setActiveTab('categories')} className="btn-press flex items-center gap-1" style={{ color:'#0B6F3A', fontSize:'12px', fontWeight:'700' }}>
                      View All <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2" style={{ WebkitOverflowScrolling:'touch' }}>
                    {fallback.map((prod, idx) => {
                      const qty = cart[prod.id] || 0;
                      const disc = prod.mrp > prod.price ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0;
                      const rating = prod.id ? Math.min(5, parseFloat((3.5 + ((prod.id.charCodeAt(prod.id.length-1) % 15)/10)).toFixed(1))) : 4.2;
                      const reviewCount = Math.floor(18 + (prod.stock || 0) % 50);
                      return (
                        <div key={prod.id} className={`prod-card-new flex-shrink-0 bg-white stagger-${Math.min(idx+1,8)}`} style={{ width:'136px', borderRadius:'18px', border:'1px solid #ebebf0', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', overflow:'hidden' }}>
                          <div className="relative" style={{ height:'110px', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'center', padding:'10px' }}>
                            {disc > 0 && <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black" style={{ background:'#16a34a', color:'#fff' }}>{disc}% OFF</span>}
                            <button onClick={e => toggleWishlist(prod.id, e)} className="absolute top-2 right-2 btn-press" style={{ background:'rgba(255,255,255,0.9)', border:'1px solid #e5e7eb', borderRadius:'50%', width:'26px', height:'26px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color: wishlistedIds.has(prod.id) ? '#EE4224' : '#9ca3af' }}>
                              {wishlistedIds.has(prod.id) ? '♥' : '♡'}
                            </button>
                            <img src={getProductImage(prod.name, prod.images)} alt={prod.name} onClick={() => setSelectedProductDetails(prod)} className="cursor-pointer max-h-full max-w-full object-contain" style={{ maxHeight:'85px' }} onError={e => { e.target.src='/logo.png'; }} />
                          </div>
                          <div className="p-2.5">
                            <p onClick={() => setSelectedProductDetails(prod)} className="cursor-pointer line-clamp-2 leading-snug mb-1" style={{ fontSize:'11.5px', fontWeight:'700', color:'#1a1a1a', lineHeight:'1.35' }}>{prod.name}</p>
                            {prod.unit && <p style={{ fontSize:'10px', color:'#9ca3af', fontWeight:'500', marginBottom:'4px' }}>{prod.unit}</p>}
                            <div className="flex items-center gap-1 mb-2">
                              <span style={{ color:'#f59e0b', fontSize:'10px' }}>★</span>
                              <span style={{ fontSize:'10px', fontWeight:'700', color:'#374151' }}>{rating}</span>
                              <span style={{ fontSize:'9px', color:'#9ca3af' }}>({reviewCount})</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span style={{ fontSize:'14px', fontWeight:'800', color:'#1a1a1a' }}>₹{prod.price}</span>
                              {prod.mrp > prod.price && <span style={{ fontSize:'10px', color:'#d1d5db', textDecoration:'line-through' }}>₹{prod.mrp}</span>}
                            </div>
                            {qty > 0 ? (
                              <div className="flex items-center justify-between rounded-xl overflow-hidden" style={{ background:'linear-gradient(135deg,#0B6F3A,#14a857)', height:'30px' }}>
                                <button onClick={() => updateCartQty(prod.id,-1)} className="btn-press flex items-center justify-center" style={{ width:'32px', height:'30px', color:'#fff', background:'none', border:'none', fontSize:'16px', cursor:'pointer' }}>−</button>
                                <span style={{ color:'#fff', fontWeight:'800', fontSize:'13px', minWidth:'18px', textAlign:'center' }}>{qty}</span>
                                <button onClick={() => updateCartQty(prod.id,1)} className="btn-press flex items-center justify-center" style={{ width:'32px', height:'30px', color:'#fff', background:'none', border:'none', fontSize:'16px', cursor:'pointer' }}>+</button>
                              </div>
                            ) : (
                              <button onClick={() => prod.stock > 0 && updateCartQty(prod.id,1)} disabled={prod.stock===0} className="add-btn w-full flex items-center justify-center gap-1" style={{ height:'30px', borderRadius:'10px', border: prod.stock===0 ? '1.5px solid #e5e7eb' : '1.5px solid #0B6F3A', background:'#fff', color: prod.stock===0 ? '#d1d5db' : '#0B6F3A', fontSize:'12px', fontWeight:'700', cursor: prod.stock===0 ? 'not-allowed' : 'pointer' }}>
                                + ADD
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── BENEFIT CARDS ── */}
            <div className="px-4 pt-4 pb-1">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon:'🌱', title:'Fresh Picks', desc:'Fresh products for your everyday needs.', bg:'#f0fdf4', border:'#bbf7d0', iconBg:'#dcfce7' },
                  { icon:'🏅', title:'Best Prices', desc:'Low prices every day, maximum savings.', bg:'#fffbeb', border:'#fde68a', iconBg:'#fef3c7' },
                  { icon:'🚚', title:'Fast Delivery', desc:'On time, every time at your doorstep.', bg:'#fdf2f8', border:'#f9a8d4', iconBg:'#fce7f3' },
                  { icon:'🛡️', title:'Safe & Secure', desc:'100% safe payments & easy returns.', bg:'#eff6ff', border:'#bfdbfe', iconBg:'#dbeafe' },
                ].map((card, i) => (
                  <div key={card.title} className={`stagger-${i+1}`} style={{ background: card.bg, border:`1px solid ${card.border}`, borderRadius:'16px', padding:'12px' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'10px', background: card.iconBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'8px', fontSize:'16px' }}>{card.icon}</div>
                    <p style={{ fontSize:'12px', fontWeight:'800', color:'#1a1a1a', marginBottom:'3px' }}>{card.title}</p>
                    <p style={{ fontSize:'10px', color:'#6b7280', lineHeight:'1.4', fontWeight:'500' }}>{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── TODAY'S DEALS ── */}
            {(() => {
              const dealProds = products.filter(p => {
                if (p.status !== 'published') return false;
                if (p.todayOffer || (p.mrp > p.price && ((p.mrp - p.price) / p.mrp) >= 0.10)) return true;
                return false;
              }).filter(p => !p.pincodesAvailable || p.pincodesAvailable.length === 0 || p.pincodesAvailable.includes(pincode)).slice(0, 10);
              if (dealProds.length === 0) return null;
              return (
                <div className="pt-5 pb-2">
                  <div className="flex items-center justify-between px-4 mb-3">
                    <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#1a1a1a' }}>🔥 Today's Deals</h2>
                    <button onClick={() => setActiveTab('categories')} className="btn-press flex items-center gap-1" style={{ color:'#0B6F3A', fontSize:'12px', fontWeight:'700' }}>
                      View All <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2" style={{ WebkitOverflowScrolling:'touch' }}>
                    {dealProds.map((prod, idx) => {
                      const qty = cart[prod.id] || 0;
                      const disc = prod.mrp > prod.price ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0;
                      return (
                        <div key={prod.id} className={`prod-card-new flex-shrink-0 bg-white stagger-${Math.min(idx+1,8)}`} style={{ width:'120px', borderRadius:'16px', border:'1px solid #ebebf0', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', overflow:'hidden' }}>
                          <div className="relative" style={{ height:'96px', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'center', padding:'8px' }}>
                            {disc > 0 && <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black" style={{ background:'#EE4224', color:'#fff' }}>{disc}% OFF</span>}
                            <button onClick={e => toggleWishlist(prod.id, e)} className="absolute top-1.5 right-1.5 btn-press" style={{ background:'rgba(255,255,255,0.9)', border:'1px solid #e5e7eb', borderRadius:'50%', width:'22px', height:'22px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color: wishlistedIds.has(prod.id) ? '#EE4224' : '#9ca3af' }}>
                              {wishlistedIds.has(prod.id) ? '♥' : '♡'}
                            </button>
                            <img src={getProductImage(prod.name, prod.images)} alt={prod.name} onClick={() => setSelectedProductDetails(prod)} className="cursor-pointer max-h-full max-w-full object-contain" style={{ maxHeight:'76px' }} onError={e => { e.target.src='/logo.png'; }} />
                          </div>
                          <div className="p-2">
                            <p onClick={() => setSelectedProductDetails(prod)} className="cursor-pointer line-clamp-2 leading-snug mb-1" style={{ fontSize:'10.5px', fontWeight:'700', color:'#1a1a1a', lineHeight:'1.3' }}>{prod.name}</p>
                            <div className="flex items-baseline gap-1 mb-1.5">
                              <span style={{ fontSize:'13px', fontWeight:'800', color:'#1a1a1a' }}>₹{prod.price}</span>
                              {prod.mrp > prod.price && <span style={{ fontSize:'9px', color:'#d1d5db', textDecoration:'line-through' }}>₹{prod.mrp}</span>}
                            </div>
                            {qty > 0 ? (
                              <div className="flex items-center justify-between rounded-lg overflow-hidden" style={{ background:'linear-gradient(135deg,#0B6F3A,#14a857)', height:'26px' }}>
                                <button onClick={() => updateCartQty(prod.id,-1)} className="btn-press flex items-center justify-center" style={{ width:'28px', height:'26px', color:'#fff', background:'none', border:'none', fontSize:'14px', cursor:'pointer' }}>−</button>
                                <span style={{ color:'#fff', fontWeight:'800', fontSize:'12px' }}>{qty}</span>
                                <button onClick={() => updateCartQty(prod.id,1)} className="btn-press flex items-center justify-center" style={{ width:'28px', height:'26px', color:'#fff', background:'none', border:'none', fontSize:'14px', cursor:'pointer' }}>+</button>
                              </div>
                            ) : (
                              <button onClick={() => prod.stock > 0 && updateCartQty(prod.id,1)} disabled={prod.stock===0} className="add-btn w-full flex items-center justify-center gap-1" style={{ height:'26px', borderRadius:'8px', border: prod.stock===0 ? '1.5px solid #e5e7eb' : '1.5px solid #0B6F3A', background:'#fff', color: prod.stock===0 ? '#d1d5db' : '#0B6F3A', fontSize:'11px', fontWeight:'700', cursor: prod.stock===0 ? 'not-allowed' : 'pointer' }}>
                                + ADD
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── SEARCH RESULTS (when search active) ── */}
            {searchQuery && (() => {
              const results = getFilteredProducts();
              return (
                <div className="pt-4 pb-2 px-4">
                  <p style={{ fontSize:'13px', fontWeight:'700', color:'#6b7280', marginBottom:'12px' }}>
                    {results.length} result{results.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                  {results.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <span style={{ fontSize:'40px', marginBottom:'12px' }}>🔍</span>
                      <p style={{ fontSize:'14px', fontWeight:'700', color:'#374151' }}>No products found</p>
                      <p style={{ fontSize:'12px', color:'#9ca3af', marginTop:'4px' }}>Try a different search term</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {results.map(prod => <ProductCard key={prod.id} product={prod} />)}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="h-6" />
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
                  { id: 'COD', title: 'Cash / Pay on Delivery (COD)', enabled: true },
                  { id: 'Card', title: 'Credit / Debit / ATM Card', enabled: false },
                  { id: 'UPI', title: 'UPI Payment (GPay, PhonePe, Paytm)', enabled: false },
                ].map((pm) => (
                  <div
                    key={pm.id}
                    onClick={() => {
                      if (!pm.enabled) {
                        alert('Online payments are coming soon. Please use Cash on Delivery.');
                      } else {
                        setPaymentMethod(pm.id);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      pm.enabled
                        ? paymentMethod === pm.id
                          ? 'border-emerald-600 bg-emerald-50/40 font-bold'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        : 'border-gray-200 bg-gray-50/70 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_opt"
                        value={pm.id}
                        disabled={!pm.enabled}
                        checked={paymentMethod === pm.id}
                        onChange={() => {
                          if (pm.enabled) setPaymentMethod(pm.id);
                        }}
                        className="accent-emerald-600 h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-xs font-bold text-gray-800">{pm.title}</span>
                    </div>

                    {!pm.enabled && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Coming Soon
                      </span>
                    )}
                  </div>
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

        {/* SCREEN: Wishlist */}
        {activeTab === 'wishlist' && (
          <WishlistScreen
            wishlistedIds={wishlistedIds}
            toggleWishlist={toggleWishlist}
            products={products}
            cart={cart}
            updateCartQty={updateCartQty}
            setSelectedProductDetails={setSelectedProductDetails}
            setActiveTab={setActiveTab}
          />
        )}

        {/* SCREEN: My Orders */}
        {activeTab === 'orders' && (
          <MyOrdersScreen
            userOrders={userOrders}
            viewOrder={viewOrder}
            setViewOrder={setViewOrder}
            setTrackingOrderId={setTrackingOrderId}
            setActiveTab={setActiveTab}
          />
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
          <div className="overflow-y-auto no-scrollbar pb-24" style={{ background: '#f7f7fb', minHeight: '100%' }}>

            {/* ── Guest state ─────────────────────────────────────────── */}
            {!user && (
              <div className="flex flex-col items-center justify-center px-6 pt-16 pb-10 text-center">
                {/* Avatar placeholder */}
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#ede9fe,#c4b5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontSize: 32 }}>
                  👤
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', marginBottom: 4 }}>Hey there!</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24, lineHeight: 1.5 }}>
                  Sign in to manage your profile, orders and saved addresses.
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="btn-press"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#9d5cf6)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '12px 36px', borderRadius: 14, border: 'none', boxShadow: '0 4px 18px rgba(124,58,237,0.4)' }}
                >
                  Login / Sign Up
                </button>
                <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 16 }}>
                  Login with your mobile number & OTP
                </p>
              </div>
            )}

            {/* ── Logged-in state ──────────────────────────────────────── */}
            {user && !showProfileForm && (
              <div className="px-4 pt-4 space-y-4">

                {/* Profile header card */}
                <div style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#9d5cf6 100%)', borderRadius: 20, padding: '20px 16px', boxShadow: '0 6px 24px rgba(124,58,237,0.3)' }}>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      style={{
                        width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
                        background: '#fff', border: '3px solid rgba(255,255,255,0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                      }}
                    >
                      {user.profilePic
                        ? <img src={user.profilePic} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 26, lineHeight: 1 }}>
                            {(user.name || user.phone || '?').charAt(0).toUpperCase()}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#fff', fontSize: 16, fontWeight: 900, lineHeight: 1.2, marginBottom: 3 }} className="truncate">
                        {user.name || 'Complete your profile'}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>
                        +91 {user.phone}
                      </p>
                      {user.email && (
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 }} className="truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Incomplete-profile nudge */}
                {(!user.name || !user.addressText) && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#92400e' }}>Profile incomplete</p>
                      <p style={{ fontSize: 10, color: '#b45309', marginTop: 1 }}>Add your name and delivery address to continue shopping.</p>
                    </div>
                    <button
                      onClick={() => { setEditingProfile(false); setShowProfileForm(true); }}
                      style={{ background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 800, padding: '6px 12px', borderRadius: 8, border: 'none', flexShrink: 0 }}
                      className="btn-press"
                    >
                      Complete
                    </button>
                  </div>
                )}

                {/* Info rows */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f5', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  {[
                    { label: 'Full Name',    val: user.name,         icon: '👤' },
                    { label: 'Mobile',       val: `+91 ${user.phone}`, icon: '📱' },
                    { label: 'Email',        val: user.email,        icon: '📧' },
                    { label: 'Date of Birth',val: user.dob,          icon: '🎂' },
                    { label: 'Gender',       val: user.gender,       icon: '⚧️' },
                  ].map((row, i) => row.val ? (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: '1px solid #f5f5f7' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{row.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginTop: 1 }} className="truncate">{row.val}</p>
                      </div>
                    </div>
                  ) : null)}
                </div>

                {/* Delivery address card */}
                {user.addressText && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f5', padding: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>📍 Default Delivery Address</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', lineHeight: 1.5 }}>{user.addressText}</p>
                    {user.pincode && (
                      <p style={{ fontSize: 10, color: '#6b7280', marginTop: 6 }}>Pincode: <strong>{user.pincode}</strong></p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2.5 pb-2">
                  <button
                    onClick={() => {
                      setEditingProfile(true);
                      setShowProfileForm(true);
                    }}
                    className="btn-press w-full flex items-center justify-center gap-2"
                    style={{ background: '#fff', border: '1.5px solid #7c3aed', color: '#7c3aed', fontSize: 12, fontWeight: 800, padding: '12px', borderRadius: 14 }}
                  >
                    ✏️  Edit Profile
                  </button>
                  <button
                    onClick={() => {
                      auth.signOut();
                      setUser(null);
                      // Clear all profile state
                      setProfileName(''); setProfileEmail(''); setProfileDob('');
                      setProfileGender(''); setProfilePic(''); setProfileHouse('');
                      setProfileStreet(''); setProfileArea(''); setProfileLandmark('');
                      setProfileCity(''); setProfileState(''); setProfilePincode('');
                      setShowProfileForm(false); setEditingProfile(false);
                      setActiveTab('home');
                    }}
                    className="btn-press w-full flex items-center justify-center gap-2"
                    style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', color: '#ef4444', fontSize: 12, fontWeight: 800, padding: '12px', borderRadius: 14 }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>

                {/* Notifications */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f5', padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    <Sparkles size={11} style={{ display: 'inline', marginRight: 4 }} />Store Announcements
                  </p>
                  {notifications.length === 0
                    ? <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>No announcements right now.</p>
                    : notifications.map(n => (
                        <div key={n.id} style={{ borderRadius: 10, background: '#f9f9fb', padding: '10px', marginBottom: 8, border: '1px solid #ebebf0' }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: '#1a1a1a', marginBottom: 2 }}>{n.title}</p>
                          <p style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>{n.message || n.content}</p>
                        </div>
                    ))
                  }
                </div>

                {/* Support desk */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f5', padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    <ClipboardList size={11} style={{ display: 'inline', marginRight: 4 }} />Customer Support
                  </p>
                  {supportSuccessMsg && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '8px', marginBottom: 10, fontSize: 10, fontWeight: 700, color: '#15803d', textAlign: 'center' }}>
                      {supportSuccessMsg}
                    </div>
                  )}
                  <form onSubmit={handleSupportSubmit} className="space-y-2.5">
                    <select value={supportType} onChange={e => setSupportType(e.target.value)}
                      className="w-full bg-bg-light border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-dark font-bold">
                      <option value="Delivery Issue">Delivery Delay or Issue</option>
                      <option value="Double Charged">Double Charged</option>
                      <option value="Damaged Item">Damaged Item</option>
                      <option value="Other">Other</option>
                    </select>
                    <textarea rows={3} placeholder="Describe your issue..." value={supportMessage}
                      onChange={e => setSupportMessage(e.target.value)} required
                      className="w-full bg-bg-light border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-dark font-medium resize-none" />
                    <button type="submit"
                      className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-black py-2.5 rounded-xl transition active-scale">
                      Submit Ticket
                    </button>
                  </form>
                  {supportTickets.filter(t => t.phone === user.phone).length > 0 && (
                    <div className="pt-3 border-t mt-3 space-y-2">
                      <p style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Tickets</p>
                      {supportTickets.filter(t => t.phone === user.phone).map(ticket => (
                        <div key={ticket.id} style={{ background: '#f9f9fb', borderRadius: 10, padding: 10, border: '1px solid #ebebf0' }}>
                          <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>{ticket.type}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20, background: ticket.status === 'Open' ? '#fef2f2' : '#f0fdf4', color: ticket.status === 'Open' ? '#ef4444' : '#16a34a' }}>
                              {ticket.status}
                            </span>
                          </div>
                          <p style={{ fontSize: 10, color: '#374151' }}>"{ticket.message}"</p>
                          {ticket.replyMessage && (
                            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 6, marginTop: 6 }}>
                              <p style={{ fontSize: 9, fontWeight: 800, color: '#16a34a', marginBottom: 2 }}>RESPONSE</p>
                              <p style={{ fontSize: 10, color: '#374151' }}>"{ticket.replyMessage}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Complete / Edit Profile Overlay ── */}
      {user && showProfileForm && (
        <div className="absolute inset-0 z-[70] overflow-y-auto no-scrollbar" style={{ background: '#f7f7fb' }}>
          <div style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#9d5cf6 100%)', padding: '16px 16px 20px', position: 'sticky', top: 0, zIndex: 1 }}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (editingProfile) { setShowProfileForm(false); setEditingProfile(false); }
                  // first-time users cannot skip — they stay on this screen
                }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: editingProfile ? 'pointer' : 'default', opacity: editingProfile ? 1 : 0 }}
              >
                ←
              </button>
              <div>
                <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 900, lineHeight: 1.2 }}>
                  {editingProfile ? 'Edit Profile' : 'Complete Your Profile'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 2 }}>
                  {editingProfile ? 'Update your details below' : 'Fill in your details to start shopping'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ padding: '16px 16px 40px' }}>
            {/* Section: Personal info */}
            <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Personal Information</p>
            <div className="space-y-3" style={{ marginBottom: 20 }}>
              {[
                { label: 'Full Name *', val: profileName, set: setProfileName, ph: 'Enter your full name', type: 'text', req: true },
                { label: 'Email Address', val: profileEmail, set: setProfileEmail, ph: 'email@example.com', type: 'email', req: false },
                { label: 'Date of Birth', val: profileDob, set: setProfileDob, ph: '', type: 'date', req: false },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input
                    type={f.type} value={f.val} required={f.req} placeholder={f.ph}
                    onChange={e => { f.set(e.target.value); setProfileFormErr(''); }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#1a1a1a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Gender</label>
                <select value={profileGender} onChange={e => setProfileGender(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#1a1a1a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Section: Delivery address */}
            <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Delivery Address</p>
            <div className="space-y-3" style={{ marginBottom: 20 }}>
              {[
                { label: 'House / Flat / Door No. *', val: profileHouse,    set: setProfileHouse,    ph: 'e.g. Flat 4B',          req: true  },
                { label: 'Street / Road',             val: profileStreet,   set: setProfileStreet,   ph: 'e.g. MG Road',          req: false },
                { label: 'Area / Colony / Locality',  val: profileArea,     set: setProfileArea,     ph: 'e.g. Koramangala',      req: false },
                { label: 'Landmark (Optional)',       val: profileLandmark, set: setProfileLandmark, ph: 'e.g. Near City Mall',   req: false },
                { label: 'City *',                    val: profileCity,     set: setProfileCity,     ph: 'e.g. Bangalore',        req: true  },
                { label: 'State *',                   val: profileState,    set: setProfileState,    ph: 'e.g. Karnataka',        req: true  },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input
                    type="text" value={f.val} required={f.req} placeholder={f.ph}
                    onChange={e => { f.set(e.target.value); setProfileFormErr(''); }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#1a1a1a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Pincode *</label>
                <input
                  type="text" inputMode="numeric" maxLength={6} value={profilePincode} required
                  placeholder="6-digit pincode"
                  onChange={e => { setProfilePincode(e.target.value.replace(/\D/g, '')); setProfileFormErr(''); }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#1a1a1a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Error */}
            {profileFormErr && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#ef4444' }}>
                ⚠️ {profileFormErr}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={profileSaving}
              className="btn-press w-full"
              style={{ background: profileSaving ? '#9ca3af' : 'linear-gradient(135deg,#7c3aed,#9d5cf6)', color: '#fff', fontSize: 14, fontWeight: 900, padding: '14px', borderRadius: 14, border: 'none', boxShadow: '0 4px 18px rgba(124,58,237,0.4)', cursor: profileSaving ? 'wait' : 'pointer' }}
            >
              {profileSaving ? 'Saving…' : editingProfile ? '💾  Save Changes' : '✅  Complete Profile & Continue'}
            </button>

            {editingProfile && (
              <button
                type="button"
                onClick={() => { setShowProfileForm(false); setEditingProfile(false); }}
                className="btn-press w-full mt-3"
                style={{ background: 'transparent', color: '#9ca3af', fontSize: 12, fontWeight: 700, padding: '10px', borderRadius: 12, border: '1.5px solid #e5e7eb' }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      )}

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

      {/* ── NEW PREMIUM BOTTOM NAV (6-tab with center Search FAB) ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20"
        style={{ height: '64px', background: '#ffffff', borderTop: '1px solid #f0f0f5', boxShadow: '0 -4px 24px rgba(0,0,0,0.09)' }}
      >
        <div className="grid grid-cols-6 h-full">
          {/* Home */}
          {[
            { id:'home',       label:'Home',       icon:Home,         badge:0 },
            { id:'categories', label:'Categories', icon:Grid,         badge:0 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn-press flex flex-col items-center justify-center gap-0.5 relative">
                {isActive && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'24px', height:'3px', background:'linear-gradient(135deg,#7c3aed,#9d5cf6)', borderRadius:'0 0 3px 3px' }} />}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} style={{ color: isActive ? '#7c3aed' : '#9ca3af' }} />
                <span style={{ fontSize:'9px', fontWeight: isActive ? '800' : '500', color: isActive ? '#7c3aed' : '#9ca3af' }}>{tab.label}</span>
              </button>
            );
          })}
          {/* Center Search FAB */}
          <button
            onClick={() => { setActiveTab('home'); setTimeout(() => document.querySelector('input[placeholder*="Search"]')?.focus(), 100); }}
            className="btn-press flex flex-col items-center justify-center relative"
          >
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#9d5cf6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(124,58,237,0.45)', marginTop:'-18px', border:'3px solid #fff' }}>
              <Search size={20} style={{ color:'#fff' }} strokeWidth={2.5} />
            </div>
          </button>
          {/* Wishlist */}
          <button onClick={() => setActiveTab('wishlist')} className="btn-press flex flex-col items-center justify-center gap-0.5 relative">
            {activeTab === 'wishlist' && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'24px', height:'3px', background:'linear-gradient(135deg,#7c3aed,#9d5cf6)', borderRadius:'0 0 3px 3px' }} />}
            <div className="relative">
              <span style={{ fontSize:'20px', lineHeight:1, color: wishlistedIds.size > 0 ? '#EE4224' : (activeTab==='wishlist' ? '#7c3aed' : '#9ca3af') }}>{wishlistedIds.size > 0 ? '♥' : '♡'}</span>
              {wishlistedIds.size > 0 && <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background:'#EE4224' }}>{wishlistedIds.size > 9 ? '9+' : wishlistedIds.size}</span>}
            </div>
            <span style={{ fontSize:'9px', fontWeight: activeTab==='wishlist' ? '800' : '500', color: activeTab==='wishlist' ? '#7c3aed' : '#9ca3af' }}>Wishlist</span>
          </button>
          {/* Cart */}
          <button onClick={() => setActiveTab('cart')} className="btn-press flex flex-col items-center justify-center gap-0.5 relative">
            {activeTab === 'cart' && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'24px', height:'3px', background:'linear-gradient(135deg,#7c3aed,#9d5cf6)', borderRadius:'0 0 3px 3px' }} />}
            <div className="relative">
              <ShoppingBag size={20} strokeWidth={activeTab==='cart' ? 2.5 : 1.8} style={{ color: activeTab==='cart' ? '#7c3aed' : '#9ca3af' }} />
              {getCartItemsCount() > 0 && <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background:'#EE4224' }}>{getCartItemsCount() > 9 ? '9+' : getCartItemsCount()}</span>}
            </div>
            <span style={{ fontSize:'9px', fontWeight: activeTab==='cart' ? '800' : '500', color: activeTab==='cart' ? '#7c3aed' : '#9ca3af' }}>Cart</span>
          </button>
          {/* Account */}
          <button onClick={() => setActiveTab('profile')} className="btn-press flex flex-col items-center justify-center gap-0.5 relative">
            {activeTab === 'profile' && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'24px', height:'3px', background:'linear-gradient(135deg,#7c3aed,#9d5cf6)', borderRadius:'0 0 3px 3px' }} />}
            <User size={20} strokeWidth={activeTab==='profile' ? 2.5 : 1.8} style={{ color: activeTab==='profile' ? '#7c3aed' : '#9ca3af' }} />
            <span style={{ fontSize:'9px', fontWeight: activeTab==='profile' ? '800' : '500', color: activeTab==='profile' ? '#7c3aed' : '#9ca3af' }}>Account</span>
          </button>
        </div>
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

      {/* PRODUCT DETAILS — full-screen page matching reference */}
      {selectedProductDetails && (() => {
        const p           = selectedProductDetails;
        const variantList = p.variants ? p.variants.split(',').map(v => v.trim()).filter(Boolean) : [];
        const activeVar   = detailsVariant || p.unit || (variantList[0] || '');
        const discPct     = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
        const savings     = p.mrp > p.price ? (p.mrp - p.price) : 0;
        const qty         = cart[p.id] || 0;
        const isLiked     = wishlistedIds.has(p.id);
        const inStock     = p.stock > 0;
        const imgSrc      = getProductImage(p.name, p.images);

        return (
          /* full-screen — covers entire phone screen, background white */
          <div
            className="absolute inset-0 z-50 bg-white animate-fade-in"
            style={{ display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}
          >
            {/* ── IMAGE SECTION — top half, full width, white bg ── */}
            <div style={{
              position: 'relative', width: '100%',
              height: '45vw', minHeight: '240px', maxHeight: '320px',
              background: '#f8f8f8', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Product image — full, contain, centered, never cropped */}
              <img
                src={imgSrc}
                alt={p.name}
                style={{
                  maxWidth: '80%', maxHeight: '90%',
                  width: 'auto', height: 'auto',
                  objectFit: 'contain', display: 'block',
                }}
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
              {/* Fallback */}
              <div style={{ display: 'none', position: 'absolute', inset: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#9ca3af', fontSize: '12px', fontWeight: '500' }}>
                <span style={{ fontSize: '40px' }}>📦</span>
                Product image unavailable
              </div>

              {/* Back button — top-left */}
              <button
                onClick={() => setSelectedProductDetails(null)}
                style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 4, width: '34px', height: '34px', borderRadius: '50%', background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', color: '#374151', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', lineHeight: 1 }}
              >‹</button>

              {/* Discount badge — top-left, beside back */}
              {discPct > 0 && (
                <div style={{ position: 'absolute', top: '14px', left: '54px', zIndex: 4, background: '#EE4224', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', boxShadow: '0 2px 6px rgba(238,66,36,0.4)' }}>
                  {discPct}% OFF
                </div>
              )}

              {/* Wishlist heart — top-right */}
              <button
                onClick={e => { e.stopPropagation(); toggleWishlist(p.id, e); }}
                style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 4, width: '38px', height: '38px', borderRadius: '50%', background: isLiked ? '#EE4224' : '#fff', border: `1.5px solid ${isLiked ? '#EE4224' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '17px', lineHeight: 1, color: isLiked ? '#fff' : '#ccc', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
              >♥</button>

              {/* Carousel dots */}
              <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <div style={{ width: '18px', height: '5px', borderRadius: '3px', background: '#0B6F3A' }} />
                {[1,2,3].map(i => <div key={i} style={{ width: '6px', height: '5px', borderRadius: '3px', background: '#d1d5db' }} />)}
              </div>
            </div>

            {/* ── SCROLLABLE INFO SECTION ── */}
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', background: '#fff', paddingBottom: '88px' }}>

              {/* Brand + Name + Category·Size */}
              <div style={{ padding: '16px 16px 12px' }}>
                {p.brand && (
                  <span style={{ display: 'inline-block', background: '#E7F5ED', color: '#0B6F3A', fontSize: '10px', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{p.brand}</span>
                )}
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111', lineHeight: 1.2, margin: '0 0 4px' }}>{p.name}</h2>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, fontWeight: '500' }}>
                  {p.department || 'Grocery'}{activeVar ? ` · ${activeVar}` : ''}
                </p>
              </div>

              {/* Price card — 3 columns exactly like reference */}
              <div style={{ margin: '0 16px 14px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #eee', padding: '12px 16px', display: 'flex' }}>
                <div style={{ flex: 1, borderRight: p.mrp > p.price ? '1px solid #e5e7eb' : 'none', paddingRight: '10px' }}>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px', fontWeight: '500' }}>Our Price</p>
                  <p style={{ fontSize: '26px', fontWeight: '900', color: '#111', margin: 0, lineHeight: 1 }}>₹{p.price}</p>
                </div>
                {p.mrp > p.price && (
                  <>
                    <div style={{ flex: 1, paddingLeft: '10px', paddingRight: '10px', borderRight: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px', fontWeight: '500' }}>MRP</p>
                      <p style={{ fontSize: '17px', fontWeight: '600', color: '#bbb', margin: 0, textDecoration: 'line-through', lineHeight: 1.35 }}>₹{p.mrp}</p>
                    </div>
                    <div style={{ flex: 1, paddingLeft: '10px' }}>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px', fontWeight: '500' }}>You Save</p>
                      <p style={{ fontSize: '15px', fontWeight: '800', color: '#059669', margin: 0, lineHeight: 1.35 }}>₹{savings.toFixed(0)} ({discPct}%)</p>
                    </div>
                  </>
                )}
              </div>

              {/* Stock */}
              <div style={{ margin: '0 16px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: inStock ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: inStock ? '#16a34a' : '#dc2626' }}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                {inStock && p.stock > 0 && (
                  <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '400' }}>· {p.stock} units available</span>
                )}
              </div>

              {/* SELECT SIZE / UNIT */}
              {(variantList.length > 0 || p.unit) && (
                <div style={{ margin: '0 16px 16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '800', color: '#111', marginBottom: '10px', letterSpacing: '0.03em' }}>SELECT SIZE / UNIT</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(variantList.length > 0 ? variantList : [p.unit]).filter(Boolean).map(v => {
                      const sel = activeVar === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setDetailsVariant(v)}
                          style={{
                            minWidth: '56px', padding: '8px 18px', borderRadius: '24px', cursor: 'pointer',
                            border: `2px solid ${sel ? '#0B6F3A' : '#bbb'}`,
                            background: sel ? '#0B6F3A' : '#fff',
                            color: sel ? '#fff' : '#333',
                            fontSize: '13px', fontWeight: '700',
                            transition: 'all 0.15s',
                            boxShadow: sel ? '0 2px 8px rgba(11,111,58,0.25)' : 'none',
                          }}
                        >{v}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QUANTITY */}
              <div style={{ margin: '0 16px 16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#111', marginBottom: '10px', letterSpacing: '0.03em' }}>QUANTITY</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
                    <button
                      onClick={() => { if (qty > 0) updateCartQty(p.id, -1); }}
                      disabled={!inStock || qty === 0}
                      style={{ width: '38px', height: '38px', background: 'none', border: 'none', cursor: qty > 0 && inStock ? 'pointer' : 'default', fontSize: '20px', color: qty > 0 ? '#374151' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >−</button>
                    <span style={{ width: '38px', textAlign: 'center', fontSize: '16px', fontWeight: '800', color: '#111' }}>{qty}</span>
                    <button
                      onClick={() => updateCartQty(p.id, 1)}
                      disabled={!inStock}
                      style={{ width: '38px', height: '38px', background: 'none', border: 'none', cursor: inStock ? 'pointer' : 'default', fontSize: '20px', color: inStock ? '#374151' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >+</button>
                  </div>
                  {qty > 0 && activeVar && (
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>You are buying {qty} × {activeVar}</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#f0f0f0', margin: '0 0 16px' }} />

              {/* PRODUCT DETAILS */}
              {p.description && (
                <div style={{ padding: '0 16px 16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#111', marginBottom: '8px', letterSpacing: '0.02em' }}>PRODUCT DETAILS</p>
                  <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.7, margin: '0 0 6px', fontWeight: '400' }}>
                    {p.description.length > 160 ? p.description.slice(0, 160) + '…' : p.description}
                  </p>
                  {p.description.length > 160 && (
                    <span style={{ fontSize: '13px', color: '#0B6F3A', fontWeight: '600', cursor: 'pointer' }}>Read more ∨</span>
                  )}
                </div>
              )}

              {p.locationId && (
                <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={12} style={{ color: '#0B6F3A' }} />
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Aisle {p.locationId}</span>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: '1px', background: '#f0f0f0', margin: '0 0 16px' }} />

              {/* RATINGS & REVIEWS */}
              <div style={{ padding: '0 16px 16px' }}>
                <ProductReviews productId={p.id} user={user} userOrders={userOrders} />
              </div>
            </div>

            {/* ── STICKY BOTTOM BAR — matches reference exactly ── */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
              background: '#fff', borderTop: '1px solid #f0f0f0',
              padding: '10px 14px 16px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 -3px 16px rgba(0,0,0,0.07)',
            }}>
              {/* Qty mini stepper — left side with label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => { if (qty > 0) updateCartQty(p.id, -1); }} disabled={!inStock || qty === 0}
                    style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: qty > 0 && inStock ? 'pointer' : 'default', fontSize: '16px', color: qty > 0 ? '#374151' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '15px', fontWeight: '800', color: '#111' }}>{qty}</span>
                  <button onClick={() => updateCartQty(p.id, 1)} disabled={!inStock}
                    style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: inStock ? 'pointer' : 'default', fontSize: '16px', color: inStock ? '#374151' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>

              {/* Add to Basket — outlined green */}
              <button
                disabled={!inStock}
                onClick={() => { if (!inStock) return; if (qty === 0) updateCartQty(p.id, 1); setProductDetailsAddedMsg(true); setTimeout(() => setProductDetailsAddedMsg(false), 2000); }}
                style={{ flex: 1, height: '50px', borderRadius: '14px', border: `2px solid ${inStock ? '#0B6F3A' : '#e5e7eb'}`, background: '#fff', color: inStock ? '#0B6F3A' : '#9ca3af', fontSize: '13px', fontWeight: '800', cursor: inStock ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ShoppingCart size={15} strokeWidth={2.5} />
                {productDetailsAddedMsg ? 'Added ✓' : (inStock ? 'Add to Basket' : 'Out of Stock')}
              </button>

              {/* Buy Now — solid green */}
              <button
                disabled={!inStock}
                onClick={() => { if (!inStock) return; if (qty === 0) updateCartQty(p.id, 1); setSelectedProductDetails(null); setActiveTab('checkout'); }}
                style={{ flex: 1, height: '50px', borderRadius: '14px', border: 'none', background: inStock ? '#0B6F3A' : '#e5e7eb', color: inStock ? '#fff' : '#9ca3af', fontSize: '13px', fontWeight: '800', cursor: inStock ? 'pointer' : 'not-allowed', boxShadow: inStock ? '0 4px 14px rgba(11,111,58,0.35)' : 'none' }}
              >
                Buy Now
              </button>
            </div>
          </div>
        );
      })()}

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
                setAuthError('');
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
