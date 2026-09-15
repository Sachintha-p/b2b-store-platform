import { Routes, Route, useLocation } from 'react-router-dom'
import ProductList from './components/ProductList'
import ProductDetail from './components/ProductDetail'
import Home from './components/Home'
import CartOverlay from './components/CartOverlay'
import AdminOrders from './components/AdminOrders'
import AdminCoupons from './components/AdminCoupons'
import AdminInventory from './components/AdminInventory'
import Login from './components/Login'
import Register from './components/Register'
import Profile from './components/Profile'
import Wishlist from './components/Wishlist'
import Success from './components/Success'
import Cancel from './components/Cancel'
import OAuth2RedirectHandler from './components/OAuth2RedirectHandler'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'

function App() {
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/register'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {shouldShowNavbar && <Navbar />}
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
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

