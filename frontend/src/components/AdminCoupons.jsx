import React, { useState, useEffect } from 'react';
import api from '../api';
import { Tag, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '',
  });

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/coupons');
      setCoupons(response.data);
    } catch (err) {
      console.error("Failed to fetch coupons", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        code: formData.code.toUpperCase(),
        type: formData.type,
        discountValue: parseFloat(formData.discountValue),
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null
      });
      setFormData({ code: '', type: 'PERCENTAGE', discountValue: '', minOrderValue: '' });
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
        <Link to="/admin/orders" className="text-gray-500 hover:text-gray-900 font-medium">Orders</Link>
        <span className="text-gray-300">|</span>
        <Link to="/admin/coupons" className="text-primary font-bold border-b-2 border-primary pb-4 -mb-[17px]">Coupons</Link>
        <span className="text-gray-300">|</span>
        <Link to="/admin/inventory" className="text-gray-500 hover:text-gray-900 font-medium">Inventory</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-gray-900">New Coupon</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input 
                type="text" 
                required
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none uppercase" 
                placeholder="SUMMER20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={formData.discountValue}
                onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (Optional)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({...formData, minOrderValue: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                placeholder="50.00"
              />
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-xl transition-colors mt-2">
              Create Coupon
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900">Active Coupons</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Code</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Value</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Min Order</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">Loading coupons...</td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">No coupons found.</td>
                  </tr>
                ) : (
                  coupons.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 font-bold text-sm rounded-md border border-green-200">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {coupon.type === 'PERCENTAGE' ? `${coupon.discountValue}%` : `$${coupon.discountValue.toFixed(2)}`}
                      </td>
                      <td className="p-4 text-gray-500 text-sm">
                        {coupon.minOrderValue ? `$${coupon.minOrderValue.toFixed(2)}` : 'None'}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;
