/**
 * CartContext — dual-layer cart persistence.
 *
 * Layer 1 (always):  localStorage  → instant UI, survives page reload for guests
 * Layer 2 (logged-in): Supabase cart_items via /api/cart  → survives device
 *                       switches, redeployment, 24+ hours
 *
 * Sync strategy:
 *   • On login: load server cart, merge with any local guest items, then push
 *     the merged result back to the server.
 *   • On any mutation (add/remove/setQty): update localStorage immediately
 *     (optimistic), then debounce a background sync to the server.
 *   • On logout / order placed: clearCart() removes both layers.
 *   • Guest (no user): localStorage only, no API calls.
 */
import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback,
} from 'react';
import { cartApi } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const LS_KEY     = 'ushamart_cart';
const PIN_KEY    = 'ushamart_pincode';
const SYNC_DELAY = 1200; // ms debounce before pushing to server

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function lsWrite(cart) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cart)); } catch {}
}
function lsReadPin() {
  return localStorage.getItem(PIN_KEY) || '';
}

// ── Merge helper: prefer higher quantity ─────────────────────────────────────
function mergeCarts(local, server) {
  const merged = { ...server };
  for (const [k, qty] of Object.entries(local)) {
    merged[k] = Math.max(qty, merged[k] || 0);
  }
  return merged;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId   = user?.uid || user?.id || null;

  const [cart,       setCartState] = useState(lsRead);
  const [pincode,    setPincodeState] = useState(lsReadPin);
  const [serverReady, setServerReady] = useState(false);

  // ── Keep localStorage in sync with every state change ──────────────────────
  useEffect(() => { lsWrite(cart); }, [cart]);

  // ── Debounced server sync ──────────────────────────────────────────────────
  const syncTimer = useRef(null);
  const pendingCart = useRef(null);

  const scheduleSync = useCallback((nextCart) => {
    pendingCart.current = nextCart;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      if (!pendingCart.current) return;
      const snapshot = pendingCart.current;
      pendingCart.current = null;
      try {
        await cartApi.sync(snapshot);
      } catch (err) {
        // Non-fatal — localStorage already updated; server will re-sync on
        // next login. Log quietly for debugging only.
        console.warn('[CartContext] Server sync failed (non-fatal):', err.message);
      }
    }, SYNC_DELAY);
  }, []);

  // ── Load + merge cart when user logs in ────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      // User logged out — clear cart state and localStorage immediately
      // so stale items from a previous session never show on the badge.
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
        syncTimer.current = null;
      }
      pendingCart.current = null;
      setCartState({});
      lsWrite({});
      setServerReady(false);
      return;
    }

    let cancelled = false;

    async function loadServerCart() {
      try {
        const res = await cartApi.get();
        if (cancelled) return;
        const serverCart = res?.data || {};
        const localCart  = lsRead();

        if (Object.keys(serverCart).length === 0) {
          // Server cart is empty:
          //   - If local has guest items, push them to the server
          //   - If local is also empty, clear it (handles stale localStorage)
          if (Object.keys(localCart).length > 0) {
            setCartState(localCart);
            lsWrite(localCart);
            await cartApi.sync(localCart).catch(() => {});
          } else {
            // Both empty — clear any stale localStorage
            setCartState({});
            lsWrite({});
          }
        } else {
          // Server has items → merge (prefer higher qty), update local
          const merged = mergeCarts(localCart, serverCart);
          setCartState(merged);
          lsWrite(merged);
          if (JSON.stringify(merged) !== JSON.stringify(serverCart)) {
            await cartApi.sync(merged).catch(() => {});
          }
        }
        setServerReady(true);
      } catch (err) {
        // Server unavailable — continue with localStorage
        console.warn('[CartContext] Could not load server cart:', err.message);
        setServerReady(false);
      }
    }

    loadServerCart();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Mutators (all optimistic + debounced server sync) ──────────────────────
  const setCart = useCallback((updater) => {
    setCartState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      lsWrite(next);
      if (userId) scheduleSync(next);
      return next;
    });
  }, [userId, scheduleSync]);

  const addItem = useCallback((cartKey) => {
    setCart(prev => ({ ...prev, [cartKey]: (prev[cartKey] || 0) + 1 }));
  }, [setCart]);

  const removeItem = useCallback((cartKey) => {
    setCart(prev => {
      const next = { ...prev };
      if ((next[cartKey] || 0) > 1) next[cartKey] -= 1;
      else delete next[cartKey];
      return next;
    });
  }, [setCart]);

  const setQty = useCallback((cartKey, qty) => {
    setCart(prev => {
      const next = { ...prev };
      if (qty <= 0) delete next[cartKey];
      else next[cartKey] = qty;
      return next;
    });
  }, [setCart]);

  /**
   * clearCart — called after a successful order placement.
   * Clears both localStorage and the server record atomically.
   * IMPORTANT: only call this after the server confirms the order was created.
   */
  const clearCart = useCallback(async () => {
    if (syncTimer.current) {
      clearTimeout(syncTimer.current);
      syncTimer.current = null;
    }
    pendingCart.current = null;
    setCartState({});
    lsWrite({});
    if (userId) {
      await cartApi.clear().catch(err =>
        console.warn('[CartContext] Server cart clear failed:', err.message)
      );
    }
  }, [userId]);

  const setPincode = useCallback((code) => {
    setPincodeState(code);
    try { localStorage.setItem(PIN_KEY, code); } catch {}
  }, []);

  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      setQty,
      clearCart,
      itemCount,
      pincode,
      setPincode,
      serverReady,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
