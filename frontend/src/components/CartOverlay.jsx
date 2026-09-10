import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CheckoutModal from './CheckoutModal';

const CartOverlay = () => {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, getCartTotal, isWholesale } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen && !isCheckoutOpen) return null;

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-slide-in-right z-50">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Your Cart
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <ShoppingBag className="w-12 h-12 mb-4 text-gray-300" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl">
                      <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm font-medium text-primary mt-1">
                          ${(isWholesale ? item.wholesalePrice : item.retailPrice).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-gray-500 hover:text-gray-900"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-gray-500 hover:text-gray-900"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-6 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-base font-medium text-gray-900">Subtotal</span>
                <span className="text-2xl font-bold text-gray-900">${getCartTotal().toFixed(2)}</span>
              </div>
              <button 
                className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={cartItems.length === 0}
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />
    </>
  );
};

export default CartOverlay;
