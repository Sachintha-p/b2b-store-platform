import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, Bell, ShoppingCart, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import UserMenu from './UserMenu';

const Navbar = () => {
  const { user } = useAuth();
  const { getCartCount, toggleCart } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync search input with URL parameter if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchVal = params.get('search') || params.get('query') || params.get('q');
    if (searchVal) {
      setSearchTerm(searchVal);
    }
  }, [location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/products');
    }
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.08)] sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 md:gap-8">
          
          {/* 1. LEFT: Brand & Primary Navigation */}
          <div className="flex items-center gap-8 shrink-0">
            <Link to="/" className="text-2xl font-extrabold text-primary tracking-tight hover:opacity-90 transition-opacity">
              B2B/B2C Commerce
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-2">
              <Link 
                to="/" 
                className={`text-sm font-semibold transition-all px-3.5 py-1.5 rounded-full ${
                  isActive('/') 
                    ? 'bg-blue-50 text-primary font-bold shadow-xs border border-blue-100/60' 
                    : 'text-gray-700 hover:text-primary hover:bg-blue-50/60'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/products" 
                className={`text-sm font-semibold transition-all px-3.5 py-1.5 rounded-full ${
                  isActive('/products') 
                    ? 'bg-blue-50 text-primary font-bold shadow-xs border border-blue-100/60' 
                    : 'text-gray-700 hover:text-primary hover:bg-blue-50/60'
                }`}
              >
                Products
              </Link>
              <Link 
                to="/register" 
                className={`text-sm font-semibold transition-all px-3.5 py-1.5 rounded-full ${
                  isActive('/register') 
                    ? 'bg-blue-50 text-primary font-bold shadow-xs border border-blue-100/60' 
                    : 'text-gray-700 hover:text-primary hover:bg-blue-50/60'
                }`}
                title="B2B Wholesale Accounts"
              >
                For Business
              </Link>
            </nav>
          </div>

          {/* 2. CENTER: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search products, brands & categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-blue-50/30 border border-blue-100/80 rounded-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all shadow-xs"
              />
              <Search className="w-4 h-4 text-primary/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); navigate('/products'); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </form>
          </div>

          {/* 3. RIGHT SIDE ICONS: Wishlist -> Bell -> Cart -> Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Wishlist Icon (Heart) */}
            <Link
              to="/wishlist"
              className="p-2.5 text-primary/80 hover:text-primary hover:bg-blue-50/80 transition-all duration-200 relative flex items-center justify-center rounded-full"
              title="Wishlist"
            >
              <Heart 
                className={`w-5 h-5 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-primary/80'}`} 
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Notification Bell */}
            <button
              className="p-2.5 text-primary/80 hover:text-primary hover:bg-blue-50/80 transition-all duration-200 relative flex items-center justify-center rounded-full"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-primary/80" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary ring-2 ring-white rounded-full" />
            </button>

            {/* Cart Icon */}
            <button
              onClick={toggleCart}
              className="p-2.5 text-primary/80 hover:text-primary hover:bg-blue-50/80 transition-all duration-200 relative flex items-center justify-center rounded-full"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 text-primary/80" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white shadow-xs">
                  {getCartCount()}
                </span>
              )}
            </button>

            {/* Admin Quick Link */}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/orders"
                className="hidden xl:flex items-center gap-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border border-purple-100"
                title="Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}

            {/* Auth Buttons / Dropdown */}
            {user ? (
              <div className="ml-1">
                <UserMenu />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Link
                  to="/login"
                  className="text-sm font-bold text-primary hover:text-primary-hover px-3.5 py-2 rounded-xl hover:bg-blue-50/60 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-primary/80 hover:text-primary transition-colors rounded-xl hover:bg-blue-50/80 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-blue-100 bg-white/95 backdrop-blur-md px-4 pt-4 pb-6 space-y-4 shadow-xl animate-fadeIn">
          {/* Mobile Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-blue-50/40 border border-blue-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Search className="w-4 h-4 text-primary/70 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* Nav Links */}
          <div className="flex flex-col space-y-2 pt-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-semibold py-2.5 px-3 rounded-lg flex items-center ${
                isActive('/') ? 'bg-blue-50 text-primary font-bold' : 'text-gray-700 hover:text-primary hover:bg-blue-50/40'
              }`}
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-semibold py-2.5 px-3 rounded-lg flex items-center ${
                isActive('/products') ? 'bg-blue-50 text-primary font-bold' : 'text-gray-700 hover:text-primary hover:bg-blue-50/40'
              }`}
            >
              Products
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-semibold py-2.5 px-3 rounded-lg flex items-center ${
                isActive('/register') ? 'bg-blue-50 text-primary font-bold' : 'text-gray-700 hover:text-primary hover:bg-blue-50/40'
              }`}
            >
              For Business
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-gray-700 hover:text-primary py-2.5 px-3 rounded-lg flex items-center justify-between hover:bg-blue-50/40"
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-purple-700 hover:text-purple-900 py-2.5 px-3 rounded-lg hover:bg-purple-50"
              >
                Admin Orders
              </Link>
            )}
          </div>

          {/* Mobile Auth Buttons */}
          {!user && (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-bold text-primary border border-blue-200 rounded-xl hover:bg-blue-50/50"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-hover shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
