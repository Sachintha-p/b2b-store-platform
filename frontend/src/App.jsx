import { Routes, Route, Link, useLocation } from 'react-router-dom'
import ProductList from './components/ProductList'
import Home from './components/Home'
import CartOverlay from './components/CartOverlay'
import AdminOrders from './components/AdminOrders'
import AdminCoupons from './components/AdminCoupons'
import AdminInventory from './components/AdminInventory'
import Login from './components/Login'
import Register from './components/Register'
import Profile from './components/Profile'
import Success from './components/Success'
import Cancel from './components/Cancel'
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler'
import AdminRoute from './components/AdminRoute'
import { useCart } from './context/CartContext'
import { useAuth } from './context/AuthContext'
import UserMenu from './components/UserMenu'

function App() {
  const { getCartCount, toggleCart } = useCart();
  const { user, logout } = useAuth();
  
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/register'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowNavbar && (
        <header className="bg-white border-b border-primary/20 shadow-sm shadow-primary/5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary tracking-tight">B2B/B2C Commerce</Link>
          <div className="flex items-center gap-6">
            {user?.role === 'ADMIN' && (
              <Link to="/admin/orders" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Admin</Link>
            )}
            
            <UserMenu />

            {/* Notification Bell Placeholder */}
            <div className="relative">
              <button className="p-2 text-primary/80 hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>

            <div className="relative">
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                  {getCartCount()}
                </span>
              )}
              <button 
                onClick={toggleCart}
                className="p-2 text-primary/80 hover:text-primary transition-colors relative"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
          <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
        </Routes>
      </main>
      
      <CartOverlay />
    </div>
  )
}

export default App
