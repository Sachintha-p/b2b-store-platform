import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Package, User as UserIcon, Shield, Mail, Tag, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchMyOrders = async () => {
      try {
        const response = await api.get('/orders/my-orders');
        setOrders(response.data);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-6">
        {/* User Info Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          
          {/* Profile Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                {user.role === 'ADMIN' ? 'ADMIN ACCOUNT' : 'STANDARD USER'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${user.provider === 'GOOGLE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                {user.provider === 'GOOGLE' ? 'ðŸ”— Google Account' : 'ðŸ”‘ Email & Password'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900">Order History</h3>
          </div>
          
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              You haven't placed any orders yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map(order => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Order #{order.id}</div>
                      <div className="font-bold text-gray-900">${order.totalAmount?.toFixed(2)}</div>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.quantity}x {item.product?.name}</span>
                        <span className="font-medium text-gray-900">${item.priceAtPurchase?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
