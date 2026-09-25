import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [cart,       setCart]       = useState({ items: [] });
  const [cartCount,  setCartCount]  = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) { setCart({ items: [] }); setCartCount(0); return; }
    try {
      setCartLoading(true);
      const res = await api.get('/cart');
      setCart(res.data.cart || { items: [] });
      const count = (res.data.cart?.items || []).reduce((s, i) => s + i.qty, 0);
      setCartCount(count);
    } catch {
      // silent
    } finally {
      setCartLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = useCallback(async (productId, itemModel = 'Product', qty = 1) => {
    try {
      const res = await api.post('/cart/add', { productId, itemModel, qty });
      setCart(res.data.cart || { items: [] });
      setCartCount(res.data.count || 0);
      toast.success('Added to cart!');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  const updateQty = useCallback(async (productId, qty, itemModel = 'Product') => {
    try {
      const res = await api.put('/cart/update', { productId, qty, itemModel });
      setCart(res.data.cart || { items: [] });
      setCartCount(res.data.count || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cart.');
    }
  }, []);

  const removeFromCart = useCallback(async (productId, itemModel = 'Product') => {
    try {
      const res = await api.delete(`/cart/remove/${productId}?itemModel=${itemModel}`);
      setCart(res.data.cart || { items: [] });
      setCartCount(res.data.count || 0);
      toast.success('Removed from cart.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove item.');
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await api.delete('/cart/clear');
      setCart({ items: [] });
      setCartCount(0);
    } catch {
      // silent
    }
  }, []);

  const cartTotal = cart.items.reduce((s, i) => s + (i.price * i.qty), 0);

  return (
    <CartContext.Provider value={{
      cart, cartCount, cartLoading, cartTotal,
      fetchCart, addToCart, updateQty, removeFromCart, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
