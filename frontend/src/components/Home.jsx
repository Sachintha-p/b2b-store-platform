import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, Laptop, Shirt, ShieldCheck, Tag, CreditCard, Box, Zap, Truck, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import heroBanner from '../assets/hero-banner.png';
import ProductCard from './ProductCard';

const CategoryIcon = ({ name }) => {
  switch (name?.toLowerCase()) {
    case 'electronics': return <Laptop className="w-8 h-8 text-primary" />;
    case 'fashion': return <Shirt className="w-8 h-8 text-pink-500" />;
    case 'furniture': return <Box className="w-8 h-8 text-amber-500" />;
    case 'accessories': return <Tag className="w-8 h-8 text-emerald-500" />;
    default: return <Package className="w-8 h-8 text-primary" />;
  }
};

const Home = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [activeCoupons, setActiveCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [couponsRes, catsRes, prodsRes] = await Promise.all([
          api.get('/coupons/active'),
          api.get('/products/categories'),
          api.get('/products?sort=newest&limit=8')
        ]);
        setActiveCoupons(couponsRes.data);
        setCategories(catsRes.data);
        setFeaturedProducts(prodsRes.data);
      } catch (error) {
        console.error('Failed to load home data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const [recentOrderCategory, setRecentOrderCategory] = useState(null);
  const [continueShoppingProducts, setContinueShoppingProducts] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const ordersRes = await api.get('/orders/my-orders');
          const orders = ordersRes.data;
          if (orders && orders.length > 0) {
            const mostRecentOrder = orders.sort((a, b) => b.id - a.id)[0];
            if (mostRecentOrder.items && mostRecentOrder.items.length > 0) {
              const recentItem = mostRecentOrder.items[0];
              if (recentItem.product && recentItem.product.category) {
                setRecentOrderCategory(recentItem.product.category);
                const relatedRes = await api.get(`/products/${recentItem.product.id}/related`);
                setContinueShoppingProducts(relatedRes.data);
              }
            }
          }
        } catch (e) {
          console.error('Failed to load user recent order', e);
        }
      } else {
        setRecentOrderCategory(null);
        setContinueShoppingProducts([]);
      }
    };
    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const primaryCoupon = activeCoupons.length > 0 ? activeCoupons[0] : null;

  return (
    <div className="space-y-16 pb-16">
      
      {/* LIVE COUPON BANNER */}
      {primaryCoupon && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-3">
          <Tag className="w-5 h-5" />
          <span className="font-medium">
            Use code <strong className="bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">{primaryCoupon.code}</strong> for {
              primaryCoupon.type === 'PERCENTAGE' 
                ? `${primaryCoupon.discountValue}% off` 
                : `$${primaryCoupon.discountValue} off`
            }!
          </span>
        </div>
      )}

      {/* HERO SECTION */}
      <section 
        className="relative w-full min-h-[350px] md:h-[380px] flex items-center justify-center overflow-hidden shadow-2xl rounded-2xl md:rounded-3xl"
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBanner})` }}
        ></div>
        
        {/* Content Card (Glassy/Transparent) */}
        <div className="relative z-0 flex flex-col items-center justify-center text-center px-4 md:px-8 py-6 md:py-8 mx-4 md:mx-auto w-[95%] md:w-auto max-w-3xl bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl my-4">
          <span className="text-blue-300 font-bold tracking-wider text-xs uppercase mb-2 drop-shadow-md">B2B & B2C E-Commerce Platform</span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg">
            Your Business Needs, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Our Global Marketplace</span>
          </h1>
          <p className="text-gray-200 text-xs md:text-sm max-w-xl mb-5 font-medium drop-shadow-md">
            From everyday essentials to bulk business solutions â€” find everything you need, in one place. 
            Sign up for a business account to unlock wholesale pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-5">
            <Link to="/products" className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:shadow-[0_0_25px_rgba(37,99,235,0.7)] flex items-center justify-center gap-2 text-sm">
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/register" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold py-2.5 px-6 rounded-lg transition-all flex items-center justify-center backdrop-blur-sm text-sm">
              For Businesses
            </Link>
          </div>
          
          {/* Trust Row */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-5 text-[10px] md:text-xs text-gray-200 font-bold drop-shadow-md">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> Secure Payments
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> Wide Range
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> Flexible Pricing
            </div>
          </div>
        </div>
      </section>

      {/* PERSONALIZED WELCOME */}
      {user && (
        <section className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Welcome back, {user.name.split(' ')[0]}! ðŸ‘‹</h2>
            <p className="text-gray-500 font-medium mt-1">Ready to find what you need today?</p>
          </div>
          
          {recentOrderCategory && continueShoppingProducts.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Continue shopping in {recentOrderCategory}</h3>
                  <p className="text-sm text-gray-500">Based on your recent order</p>
                </div>
                <Link to={`/products?category=${encodeURIComponent(recentOrderCategory)}`} className="hidden sm:flex text-sm font-semibold text-primary hover:text-primary-hover items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {continueShoppingProducts.map(product => {
                  const isB2B = user?.customerGroup === 'WHOLESALE';
                  const displayPrice = isB2B ? product.wholesalePrice : product.retailPrice;
                  
                  return (
                    <div key={product.id} className="bg-gray-50 rounded-2xl p-4 flex flex-col hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200" onClick={() => navigate(`/products?category=${encodeURIComponent(product.category)}`)}>
                      <div className="w-full h-32 mb-3 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm truncate">{product.name}</h4>
                      <p className="text-primary font-bold text-sm mt-1">${displayPrice?.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* CATEGORY GRID */}
      {categories.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-1 block">Shop By Category</span>
              <h2 className="text-3xl font-extrabold text-gray-900">Explore Our Top Categories</h2>
            </div>
            <Link to="/products" className="hidden sm:flex text-sm font-semibold text-primary hover:text-primary-hover items-center gap-1">
              View All Categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat) => (
              <div 
                key={cat.name}
                onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer flex flex-col items-center text-center group"
              >
                <div className="bg-gray-50 group-hover:bg-primary-light p-4 rounded-full mb-4 transition-colors">
                  <CategoryIcon name={cat.name} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{cat.name}</h3>
                <p className="text-sm text-gray-500 font-medium">{cat.count} Products</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Featured Products</h2>
            <p className="text-gray-500 font-medium">Newest arrivals from our catalog</p>
          </div>
          <Link to="/products" className="hidden sm:flex text-sm font-semibold text-primary hover:text-primary-hover items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={() => navigate('/products')}
              showB2BPrice={false}
            />
          ))}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mt-12">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-1 block">Why Choose Us</span>
          <h2 className="text-3xl font-extrabold text-gray-900">Built for Everyone</h2>
          <p className="text-gray-500 mt-2">Whether you're a consumer or a business, we make shopping simple, safe, and smarter.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary-light text-primary p-4 rounded-full mb-4">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Wide Product Range</h4>
            <p className="text-sm text-gray-500">Thousands of products across multiple categories available instantly.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-purple-50 text-purple-600 p-4 rounded-full mb-4">
              <Tag className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Flexible Pricing</h4>
            <p className="text-sm text-gray-500">Special wholesale rates for registered business accounts and bulk orders.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Secure & Trusted</h4>
            <p className="text-sm text-gray-500">Your payments are fully secured via Stripe processing.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-amber-50 text-amber-600 p-4 rounded-full mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Instant Discounts</h4>
            <p className="text-sm text-gray-500">Easily apply promotional coupons during checkout to maximize savings.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
