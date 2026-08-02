import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ushamart_cart') || '{}'); }
    catch { return {}; }
  });
  const [pincode, setPincodeState] = useState(
    () => localStorage.getItem('ushamart_pincode') || ''
  );

  useEffect(() => {
    localStorage.setItem('ushamart_cart', JSON.stringify(cart));
  }, [cart]);

  const setPincode = (code) => {
    setPincodeState(code);
    localStorage.setItem('ushamart_pincode', code);
  };

  const addItem = (productId) =>
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));

  const removeItem = (productId) =>
    setCart(prev => {
      const next = { ...prev };
      if (next[productId] > 1) next[productId] -= 1;
      else delete next[productId];
      return next;
    });

  const setQty = (productId, qty) =>
    setCart(prev => {
      if (qty <= 0) { const n = { ...prev }; delete n[productId]; return n; }
      return { ...prev, [productId]: qty };
    });

  const clearCart = () => setCart({});

  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, setQty, clearCart, itemCount, pincode, setPincode }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
