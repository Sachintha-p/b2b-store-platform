import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchWishlistCount = useCallback(async () => {
    if (!user) {
      setWishlistCount(0);
      return;
    }
    try {
      const res = await api.get('/users/me/wishlist/count');
      setWishlistCount(res.data.count || 0);
    } catch (err) {
      console.error('Failed to fetch wishlist count:', err);
    }
  }, [user]);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setWishlistCount(0);
      return [];
    }
    setLoading(true);
    try {
      const res = await api.get('/users/me/wishlist');
      const items = res.data || [];
      setWishlistItems(items);
      setWishlistCount(items.length);
      return items;
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchWishlistCount();
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setWishlistCount(0);
    }
  }, [user, fetchWishlistCount, fetchWishlist]);

  const addToWishlist = async (productId) => {
    if (!user) return false;
    try {
      await api.post(`/users/me/wishlist/${productId}`);
      await fetchWishlistCount();
      await fetchWishlist();
      return true;
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return false;
    // Optimistic update
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
    setWishlistCount(prev => Math.max(0, prev - 1));
    try {
      await api.delete(`/users/me/wishlist/${productId}`);
      await fetchWishlistCount();
      return true;
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      await fetchWishlist();
      return false;
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) return false;
    const exists = wishlistItems.some(item => item.id === productId);
    if (exists) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount,
      loading,
      fetchWishlist,
      fetchWishlistCount,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
