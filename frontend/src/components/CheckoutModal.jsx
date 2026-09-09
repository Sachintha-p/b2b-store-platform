import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Tag } from 'lucide-react';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CheckoutModal = ({ isOpen, onClose }) => {
  const { cartItems, getCartTotal, clearCart, isWholesale } = useCart();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    shippingAddress: ''
  });

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Recalculate if cart changes
  useEffect(() => {
    if (discount > 0 && discount > getCartTotal()) {
      setDiscount(getCartTotal());
    }
  }, [cartItems]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    setPromoError(null);
    try {
      const response = await api.post('/coupons/validate', {
        code: promoCode,
        subtotal: getCartTotal()
      });
      if (response.data.valid) {
        setDiscount(response.data.discountAmount);
      } else {
        setPromoError(response.data.message);
        setDiscount(0);
      }
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Invalid coupon code');
      setDiscount(0);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: formData.name,
      email: formData.email,
      shippingAddress: formData.shippingAddress,
      couponCode: discount > 0 ? promoCode : null,
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        isB2B: isWholesale
      }))
    };

    try {
      // 1. Create the pending order
      const orderRes = await api.post('/orders', payload);
      
      // 2. Generate Stripe checkout session
      const paymentRes = await api.post('/payments/create-checkout-session', { 
        orderId: orderRes.data.id 
      });
      
      // 3. Redirect to Stripe Hosted Checkout
      window.location.href = paymentRes.data.url;
      
    } catch (err) {
      console.error("Order error", err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  const finalTotal = Math.max(0, getCartTotal() - discount);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => !loading && onClose()}
      />
      
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Checkout</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 rounded-full p-1 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                <textarea 
                  name="shippingAddress"
                  required
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  placeholder="123 Commerce St..."
                />
              </div>

              {/* Promo Code Section */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Have a Promo Code?</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none uppercase"
                      placeholder="ENTER CODE"
                      disabled={discount > 0}
                    />
                  </div>
                  {discount > 0 ? (
                    <button 
                      type="button"
                      onClick={() => { setDiscount(0); setPromoCode(''); }}
                      className="px-4 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={validatingPromo || !promoCode}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {validatingPromo ? '...' : 'Apply'}
                    </button>
                  )}
                </div>
                {promoError && <p className="text-red-500 text-xs mt-1.5 ml-1">{promoError}</p>}
                {discount > 0 && <p className="text-green-600 text-xs mt-1.5 ml-1 font-medium">Coupon applied successfully!</p>}
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">${getCartTotal().toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Discount ({promoCode})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-700 font-bold">Total to Pay</span>
                  <span className="text-2xl font-bold text-gray-900">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12 mt-4"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Confirm Order"
                )}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
