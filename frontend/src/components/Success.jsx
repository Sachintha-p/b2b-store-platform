import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Success = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart on successful return
    clearCart();
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
        {orderId && <p className="text-sm font-medium text-gray-700 mb-8">Order ID: #{orderId}</p>}
        
        <div className="space-y-3">
          <Link to="/profile" className="block w-full bg-gray-900 text-white font-medium py-3 px-4 rounded-xl hover:bg-black transition-colors">
            View Order History
          </Link>
          <Link to="/" className="block w-full text-primary font-medium py-3 px-4 rounded-xl hover:bg-primary-light transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Success;
