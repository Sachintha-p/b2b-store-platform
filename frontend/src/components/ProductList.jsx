import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingCart, Package, Info, Search, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api';
import ProductDetailModal from './ProductDetailModal';

const ProductList = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const cat = searchParams.get('category');
    if (cat) {
      setCategory(cat);
    }
  }, [location.search]);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: { query, category, minPrice, maxPrice }
      });
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load catalog. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch on filter change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, category, minPrice, maxPrice]);

  const openProduct = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-900">Filters</h3>
          </div>
          
          <div className="space-y-5">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range ($)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            
            <button 
              onClick={() => {setQuery(''); setCategory(''); setMinPrice(''); setMaxPrice('');}}
              className="w-full py-2 text-sm font-semibold text-primary bg-primary-light hover:bg-blue-100 rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
            <p className="mt-1 text-gray-600">Browse our selection for retail and wholesale.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
            <Info className="w-5 h-5" />
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isOutOfStock = product.stockQuantity === 0;
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group relative">
                  {/* Image Placeholder */}
                  <div 
                    onClick={() => openProduct(product)}
                    className="aspect-w-1 aspect-h-1 bg-gray-50 relative group-hover:bg-gray-100 transition-colors duration-300 flex items-center justify-center p-8 cursor-pointer"
                  >
                     <Package className="w-16 h-16 text-gray-300 group-hover:text-gray-400 transition-colors" />
                     <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur ${isOutOfStock ? 'bg-red-500/90 text-white' : 'bg-white/90 text-gray-700'}`}>
                       {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stockQuantity}`}
                     </span>
                     {product.category && (
                       <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-semibold px-2 py-1 rounded-md shadow-sm text-gray-500">
                         {product.category}
                       </span>
                     )}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 
                      onClick={() => openProduct(product)}
                      className="text-lg font-bold text-gray-900 leading-tight mb-1 cursor-pointer hover:text-primary transition-colors"
                    >
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{product.description}</p>
                    
                    <div className="space-y-2 mb-5 bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Retail</span>
                        <span className="text-lg font-bold text-primary">${product.retailPrice?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          B2B <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold">PRO</span>
                        </span>
                        <span className="text-base font-bold text-gray-900">${product.wholesalePrice?.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      disabled={isOutOfStock}
                      className={`w-full font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                        isOutOfStock 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-primary hover:bg-primary-hover text-white shadow-[0_0_10px_rgba(37,99,235,0.2)] active:scale-[0.98]'
                      }`}>
                      <ShoppingCart className="w-4 h-4" />
                      <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProductDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSelectProduct={openProduct}
      />
    </div>
  );
};

export default ProductList;
