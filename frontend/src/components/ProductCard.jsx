import React, { useState, useEffect, useRef } from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, onSelect, showB2BPrice = true }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  // Extract ordered images list (primary cover first, then gallery images)
  const images = React.useMemo(() => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    const list = [];
    if (product?.imageUrl) list.push(product.imageUrl);
    if (product?.additionalImages && Array.isArray(product.additionalImages)) {
      product.additionalImages.forEach(img => {
        if (img?.imageUrl && !list.includes(img.imageUrl)) {
          list.push(img.imageUrl);
        }
      });
    }
    return list;
  }, [product]);

  const hasMultipleImages = images.length > 1;
  const isOutOfStock = product.stockQuantity === 0;
  const displayPrice = product.retailPrice;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hasMultipleImages) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 850);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveIndex(0);
  };

  const currentImageUrl = images.length > 0 ? images[activeIndex] : null;

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group relative z-0 isolate"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Product Image Area */}
      <div 
        onClick={() => onSelect && onSelect(product)}
        className="w-full h-36 bg-gray-50 relative group-hover:bg-gray-100 transition-colors duration-300 flex items-center justify-center cursor-pointer overflow-hidden rounded-t-2xl"
      >
        {images.length > 0 ? (
          <div className="w-full h-full relative overflow-hidden">
            {images.map((imgUrl, idx) => (
              <img
                key={imgUrl + idx}
                src={imgUrl}
                alt={`${product.name} ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}
          </div>
        ) : (
          <Package className="w-12 h-12 text-gray-300 group-hover:text-gray-400 transition-colors" />
        )}

        {/* Stock Status Badge */}
        <span className={`absolute top-2 right-2 z-20 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur ${
          isOutOfStock ? 'bg-red-500/90 text-white' : 'bg-white/90 text-gray-700'
        }`}>
          {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stockQuantity}`}
        </span>

        {/* Category Badge */}
        {product.category ? (
          <span className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur text-[10px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm text-gray-500">
            {product.category}
          </span>
        ) : null}

        {/* Hover Carousel Indicator Dots */}
        {hasMultipleImages && isHovered && (
          <div className="absolute bottom-1.5 inset-x-0 z-20 flex justify-center gap-1 px-2 pointer-events-none">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? 'w-3 bg-white shadow-md'
                    : 'w-1 bg-white/60 backdrop-blur-sm'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content Details */}
      <div className="p-3.5 flex-1 flex flex-col">
        <h3 
          onClick={() => onSelect && onSelect(product)}
          className="text-sm font-bold text-gray-900 leading-tight mb-1 cursor-pointer hover:text-primary transition-colors truncate"
        >
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{product.description}</p>
        
        {/* Pricing Block */}
        <div className="flex justify-between items-end mb-3">
          <div>
            <span className="text-lg font-extrabold text-gray-900">${displayPrice?.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Add to Cart Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          disabled={isOutOfStock}
          className={`w-full text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
            isOutOfStock 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary-hover text-white shadow-[0_0_10px_rgba(37,99,235,0.2)] active:scale-[0.98]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
