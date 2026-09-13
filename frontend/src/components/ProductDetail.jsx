import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, 
  ShoppingCart, 
  Package, 
  ArrowLeft, 
  Zap, 
  ShieldCheck, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  User, 
  Tag, 
  MessageSquare,
  Plus,
  Send
} from 'lucide-react';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews & Summary state
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);
  const [userExistingReview, setUserExistingReview] = useState(null);

  // Related products
  const [related, setRelated] = useState([]);

  // Fetch product data, reviews, and related products
  const fetchProductData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);

      // Fetch related products
      api.get(`/products/${id}/related`)
        .then(r => setRelated(r.data))
        .catch(err => console.error('Failed to load related products', err));

    } catch (err) {
      console.error('Failed to fetch product', err);
      setError('Product not found or unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get(`/products/${id}/reviews`),
        api.get(`/products/${id}/reviews/summary`)
      ]);
      setReviews(listRes.data);
      setSummary(summaryRes.data);

      // Check if logged-in user already wrote a review
      if (user) {
        const existing = listRes.data.find(r => r.reviewerName === user.name);
        if (existing) {
          setUserExistingReview(existing);
          setRating(existing.rating);
          setComment(existing.comment);
        } else {
          setUserExistingReview(null);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
    fetchReviews();
    setActiveImageIndex(0);
    window.scrollTo(0, 0);
  }, [id]);

  // Handle Review submission (upsert)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setReviewSubmitting(true);
    setReviewMsg(null);
    try {
      await api.post(`/products/${id}/reviews`, { rating, comment });
      setReviewMsg({ 
        type: 'success', 
        text: userExistingReview ? 'Your review was updated successfully!' : 'Thank you! Your review has been posted.' 
      });
      await fetchReviews();
      await fetchProductData(); // Refresh overall product rating
    } catch (err) {
      console.error('Submit review error', err);
      setReviewMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to submit review. Please try again.' 
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Handle Review deletion
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/products/${id}/reviews/${reviewId}`);
      setReviewMsg({ type: 'success', text: 'Review deleted successfully.' });
      if (userExistingReview && userExistingReview.id === reviewId) {
        setUserExistingReview(null);
        setRating(5);
        setComment('');
      }
      await fetchReviews();
      await fetchProductData();
    } catch (err) {
      console.error('Delete review error', err);
      setReviewMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Could not delete review.' 
      });
    }
  };

  const handleBuyNow = () => {
    if (!product || product.stockQuantity === 0) return;
    addToCart(product);
    toggleCart();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">{error || 'Product Not Found'}</h2>
        <Link to="/products" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : (product.imageUrl ? [product.imageUrl] : []);

  const isOutOfStock = product.stockQuantity === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-16">

      {/* Back Button */}
      <div>
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>
      </div>

      {/* PRODUCT HEADER SECTION (Gallery + Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
        
        {/* Gallery */}
        <div className="space-y-4">
          <div className="w-full h-96 md:h-[450px] bg-gray-50 rounded-2xl flex items-center justify-center relative overflow-hidden border border-gray-100">
            {images.length > 0 ? (
              <img 
                src={images[activeImageIndex]} 
                alt={`${product.name} preview`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-24 h-24 text-gray-300" />
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.category && (
                <span className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-md shadow-sm text-gray-700">
                  {product.category}
                </span>
              )}
            </div>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-red-500 text-white font-extrabold px-5 py-2 rounded-full shadow-lg text-sm">
                  OUT OF STOCK
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-gray-50 ${
                    idx === activeImageIndex ? 'border-primary shadow-md scale-95' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Overview */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {product.category || 'Product'}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{summary.averageRating > 0 ? summary.averageRating.toFixed(1) : 'New'}</span>
              </div>
              <span className="text-sm font-medium text-gray-500">
                ({summary.totalReviews} {summary.totalReviews === 1 ? 'customer review' : 'customer reviews'})
              </span>
            </div>

            {/* Price */}
            <div className="pt-2">
              <span className="text-3xl font-extrabold text-gray-900">
                ${product.retailPrice?.toFixed(2)}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm md:text-base leading-relaxed border-t border-b border-gray-100 py-4">
              {product.description || 'No description available for this product.'}
            </p>

            {/* Stock Specs */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-700">Availability:</span>
              <span className={`font-bold ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stockQuantity} available)`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => addToCart(product)}
                disabled={isOutOfStock}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                Buy Now
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 pt-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Checkout
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" /> Fast Delivery Available
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Customer Reviews
            </h2>
            <p className="text-sm text-gray-500 mt-1">Real ratings and feedback from verified purchasers.</p>
          </div>

          {/* Rating Summary Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 self-start sm:self-auto">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-amber-900">
                {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '0.0'}
              </div>
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Out of 5</div>
            </div>
            <div className="border-l border-amber-200 pl-4 space-y-1">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.round(summary.averageRating) ? 'fill-amber-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <div className="text-xs font-semibold text-amber-800">
                Based on {summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {reviewMsg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            reviewMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {reviewMsg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{reviewMsg.text}</span>
          </div>
        )}

        {/* ADD / EDIT REVIEW FORM */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
          <h3 className="text-base font-bold text-gray-900">
            {userExistingReview ? 'Edit Your Review' : 'Write a Product Review'}
          </h3>

          {!user ? (
            <p className="text-sm text-gray-600">
              Please <Link to="/login" className="text-primary font-bold hover:underline">sign in</Link> to post a review for this product.
            </p>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-7 h-7 ${star <= rating ? 'fill-amber-400' : 'text-gray-300'}`} 
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-gray-700 ml-2">{rating} of 5 Stars</span>
                </div>
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Comment</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  required
                  placeholder="Share your thoughts on the product quality, fit, or performance..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none resize-none bg-white"
                />
                <span className="text-[11px] text-gray-400 block text-right mt-1">{comment.length}/1000</span>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {reviewSubmitting ? 'Submitting...' : userExistingReview ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* REVIEW LIST */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">All Reviews ({reviews.length})</h3>

          {reviewsLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl text-gray-500 text-sm border border-dashed border-gray-200">
              No reviews submitted for this product yet. Be the first to share your feedback!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {reviews.map((rev) => {
                const isAuthor = user && user.name === rev.reviewerName;
                const isAdmin = user && user.role === 'ADMIN';
                const canDelete = isAuthor || isAdmin;

                return (
                  <div key={rev.id} className="p-6 bg-white hover:bg-gray-50/50 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                          {rev.reviewerName ? rev.reviewerName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{rev.reviewerName}</span>
                            {rev.reviewerCustomerGroup === 'WHOLESALE' && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                                Wholesale Partner
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </div>

                      {/* Delete button for Author or Admin */}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Rating Stars */}
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400' : 'text-gray-200'}`} 
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-xl font-extrabold text-gray-900">You Might Also Like</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((rel) => (
              <div 
                key={rel.id}
                onClick={() => navigate(`/products/${rel.id}`)}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col hover:bg-gray-100 transition-all cursor-pointer group"
              >
                <div className="w-full h-36 mb-3 flex items-center justify-center bg-white rounded-xl overflow-hidden border border-gray-100">
                  {rel.imageUrl ? (
                    <img src={rel.imageUrl} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-sm truncate">{rel.name}</h4>
                <p className="text-primary font-extrabold text-sm mt-1">${rel.retailPrice?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetail;
