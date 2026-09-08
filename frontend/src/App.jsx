import { Routes, Route, Link, useLocation } from 'react-router-dom'
import ProductList from './components/ProductList'
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
        <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900 tracking-tight">B2B/B2C Commerce</Link>
          <div className="flex items-center gap-6">
            {user?.role === 'ADMIN' && (
              <Link to="/admin/orders" className="text-sm font-medium text-gray-600 hover:text-gray-900">Admin</Link>
            )}
            
            <UserMenu />

            <div className="relative">
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                  {getCartCount()}
                </span>
              )}
              <button 
                onClick={toggleCart}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
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
          <Route path="/" element={<ProductList />} />
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
