import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowLeft, LogIn, Package } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Wishlist = () => {
  const { user } = useAuth();
  const { wishlistItems, loading, removeFromWishlist, fetchWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user, fetchWishlist]);

  // Format price helper
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  // If unauthenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Save Your Favorites</h1>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Sign in to view your wishlisted products, receive price alerts, and easily save items for future purchasing.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-200"
          >
            <LogIn className="w-5 h-5" />
            Sign In to Account
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/products" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Catalog
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            My Wishlist
            {wishlistItems.length > 0 && (
              <span className="text-sm font-semibold bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-10 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center max-w-xl mx-auto my-12">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-rose-400 stroke-1" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            You haven't added any products to your wishlist yet. Explore our wide collection of products and tap the heart icon to save items for later.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Package className="w-5 h-5" />
            Explore Products
          </Link>
        </div>
      ) : (
        /* Product Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((product) => {
            const isOutOfStock = (product.stockQuantity ?? 0) <= 0;
            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden relative"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-rose-600 hover:bg-white shadow-sm transition-all"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Product Image */}
                <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/300?text=Product'}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {product.category && (
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-1">
                        {product.category.name || product.category}
                      </span>
                    )}
                    <Link
                      to={`/products/${product.id}`}
                      className="font-bold text-gray-900 hover:text-primary transition-colors line-clamp-2 text-base leading-snug mb-2"
                    >
                      {product.name}
                    </Link>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Price</span>
                      <span className="text-lg font-extrabold text-gray-900">
                        {formatPrice(product.retailPrice)}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                        isOutOfStock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary-hover text-white active:scale-95'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
