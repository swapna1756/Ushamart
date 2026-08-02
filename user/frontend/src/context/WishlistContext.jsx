/**
 * WishlistContext — persists wishlist to backend when user is logged in,
 * falls back to localStorage for guests.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistApi } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

const LOCAL_KEY = 'ushamart_wishlist_guest';

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids,     setIds]     = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load wishlist — from server if logged in, from localStorage if guest
  const load = useCallback(async () => {
    if (user?.id) {
      setLoading(true);
      try {
        const res = await wishlistApi.getAll();
        setIds(new Set(res.data || []));
      } catch {
        // fallback to local
        try { setIds(new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'))); }
        catch { setIds(new Set()); }
      } finally { setLoading(false); }
    } else {
      try { setIds(new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'))); }
      catch { setIds(new Set()); }
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (productId) => {
    const has = ids.has(productId);

    // Optimistic update
    setIds(prev => {
      const next = new Set(prev);
      has ? next.delete(productId) : next.add(productId);
      return next;
    });

    if (user?.id) {
      try {
        if (has) await wishlistApi.remove(productId);
        else     await wishlistApi.add(productId);
      } catch {
        // Revert on error
        setIds(prev => {
          const next = new Set(prev);
          has ? next.add(productId) : next.delete(productId);
          return next;
        });
      }
    } else {
      // Guest: save to localStorage
      const next = new Set(ids);
      has ? next.delete(productId) : next.add(productId);
      localStorage.setItem(LOCAL_KEY, JSON.stringify([...next]));
    }
  }, [ids, user?.id]);

  const clearAll = useCallback(async () => {
    setIds(new Set());
    if (user?.id) {
      try { await wishlistApi.clear(); } catch { /* ignore */ }
    } else {
      localStorage.removeItem(LOCAL_KEY);
    }
  }, [user?.id]);

  const has   = (id) => ids.has(id);
  const count = ids.size;

  return (
    <WishlistContext.Provider value={{ ids, has, toggle, clearAll, count, loading, reload: load }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() { return useContext(WishlistContext); }
