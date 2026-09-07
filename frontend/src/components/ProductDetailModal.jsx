import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Package } from 'lucide-react';
import api from '../api';
import { useCart } from '../context/CartContext';

const ProductDetailModal = ({ product, isOpen, onClose, onSelectProduct }) => {
  const { addToCart } = useCart();
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      setLoading(true);
      api.get(`/products/${product.id}/related`)
        .then(res => {
          setRelated(res.data);
        })
        .catch(err => console.error("Error fetching related:", err))
        .finally(() => setLoading(false));
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const isOutOfStock = product.stockQuantity === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{product.category || 'Uncategorized'}</span>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Product Image Placeholder */}
              <div className="w-full md:w-1/2 aspect-square bg-gray-100 rounded-2xl flex items-center justify-center relative">
                 <Package className="w-24 h-24 text-gray-300" />
                 {isOutOfStock && (
                   <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                     <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded-full shadow-lg">
                       OUT OF STOCK
                     </span>
                   </div>
                 )}
              </div>
              
              {/* Details */}
              <div className="w-full md:w-1/2 flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
                
                <div className="space-y-3 mb-8 bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Retail Price</span>
                    <span className="text-xl font-bold text-blue-600">${product.retailPrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      B2B Price <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold">PRO</span>
                    </span>
                    <span className="text-xl font-bold text-gray-900">${product.wholesalePrice?.toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    addToCart(product);
                    onClose();
                  }}
                  disabled={isOutOfStock}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}</span>
                </button>
                <p className="text-center text-sm text-gray-400 mt-3 font-medium">
                  {product.stockQuantity} units left in stock
                </p>
              </div>
            </div>
            
            {/* Related Products Carousel */}
            {related.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">You might also like</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {related.map(rel => (
                    <div 
                      key={rel.id} 
                      onClick={() => onSelectProduct(rel)}
                      className="cursor-pointer group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all hover:border-blue-200"
                    >
                      <div className="aspect-square bg-gray-50 flex items-center justify-center p-4">
                        <Package className="w-10 h-10 text-gray-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="p-3 border-t border-gray-50">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{rel.name}</h4>
                        <p className="text-xs font-bold text-blue-600 mt-1">${rel.retailPrice?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
