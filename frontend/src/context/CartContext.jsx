import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth(); // Access current user to check for ADMIN tier

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCartItems(JSON.parse(saved));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, Math.min(item.stockQuantity || 99, item.quantity + delta));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartCount = () => cartItems.reduce((total, item) => total + item.quantity, 0);

  const isAdmin = user?.role === 'ADMIN';

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.retailPrice || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      isAdmin,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartCount,
      getCartTotal,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
