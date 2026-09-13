import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Tag, 
  LogOut, 
  MapPin, 
  Building2, 
  Lock, 
  Bell, 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Star, 
  Check, 
  X,
  CreditCard
} from 'lucide-react';

const Profile = () => {
  const { user, logout, token, fetchFreshUser } = useAuth();
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState('account');

  // Account Info state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMsg, setAccountMsg] = useState(null);

  // Address Book state
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressMsg, setAddressMsg] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefaultShipping: false,
    isDefaultBilling: false
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);

  // Business Info state
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessMsg, setBusinessMsg] = useState(null);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMsg, setSecurityMsg] = useState(null);

  // Notifications state
  const [notifyOrderUpdates, setNotifyOrderUpdates] = useState(true);
  const [notifyPromotions, setNotifyPromotions] = useState(true);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Initialize fields from user state
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCompanyName(user.companyName || '');
      setTaxId(user.taxId || '');
      setNotifyOrderUpdates(user.notifyOrderUpdates ?? true);
      setNotifyPromotions(user.notifyPromotions ?? true);
    }
  }, [user, token, navigate]);

  // Fetch addresses when address tab or user changes
  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await api.get('/users/me/addresses');
      setAddresses(res.data);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
      setAddressMsg({ type: 'error', text: 'Failed to load address book.' });
    } finally {
      setAddressesLoading(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAddresses();
      fetchOrders();
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- HANDLERS ---

  // 1. Account Info Submit
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountLoading(true);
    setAccountMsg(null);
    try {
      await api.put('/users/me', {
        name,
        phone,
        shippingAddress: user?.shippingAddress || ''
      });
      await fetchFreshUser();
      setAccountMsg({ type: 'success', text: 'Account information updated successfully!' });
    } catch (err) {
      console.error('Account update failed', err);
      setAccountMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update account information.' 
      });
    } finally {
      setAccountLoading(false);
    }
  };

  // 2. Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      label: 'Home',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      isDefaultShipping: addresses.length === 0,
      isDefaultBilling: addresses.length === 0
    });
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'United States',
      isDefaultShipping: addr.defaultShipping,
      isDefaultBilling: addr.defaultBilling
    });
    setShowAddressModal(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressSubmitting(true);
    setAddressMsg(null);

    try {
      if (editingAddress) {
        await api.put(`/users/me/addresses/${editingAddress.id}`, addressForm);
        setAddressMsg({ type: 'success', text: 'Address updated successfully.' });
      } else {
        await api.post('/users/me/addresses', addressForm);
        setAddressMsg({ type: 'success', text: 'New address added successfully.' });
      }
      setShowAddressModal(false);
      await fetchAddresses();
    } catch (err) {
      console.error('Address save error', err);
      setAddressMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to save address.' 
      });
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    setAddressMsg(null);
    try {
      await api.delete(`/users/me/addresses/${id}`);
      setAddressMsg({ type: 'success', text: 'Address deleted.' });
      await fetchAddresses();
    } catch (err) {
      console.error('Delete address failed', err);
      setAddressMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Could not delete address. Check backend restrictions.' 
      });
    }
  };

  const handleSetDefaultAddress = async (id, type) => {
    setAddressMsg(null);
    try {
      await api.put(`/users/me/addresses/${id}/set-default`, { type });
      setAddressMsg({ 
        type: 'success', 
        text: `Updated default ${type} address.` 
      });
      await fetchAddresses();
    } catch (err) {
      console.error('Set default address failed', err);
      setAddressMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update default address.' 
      });
    }
  };

  // 3. Business Info Submit
  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setBusinessLoading(true);
    setBusinessMsg(null);
    try {
      await api.put('/users/me/business-info', { companyName, taxId });
      await fetchFreshUser();
      setBusinessMsg({ type: 'success', text: 'Business details updated successfully!' });
    } catch (err) {
      console.error('Business info update failed', err);
      setBusinessMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update business information.' 
      });
    } finally {
      setBusinessLoading(false);
    }
  };

  // 4. Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSecurityLoading(true);
    setSecurityMsg(null);

    if (newPassword.length < 8) {
      setSecurityMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      setSecurityLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      setSecurityLoading(false);
      return;
    }

    try {
      await api.put('/users/me/password', { currentPassword, newPassword });
      setSecurityMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password update error', err);
      setSecurityMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update password. Please check your current password.' 
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  // 5. Notifications Submit
  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    setNotifyLoading(true);
    setNotifyMsg(null);
    try {
      await api.put('/users/me/notification-preferences', {
        notifyOrderUpdates,
        notifyPromotions
      });
      await fetchFreshUser();
      setNotifyMsg({ type: 'success', text: 'Notification preferences updated!' });
    } catch (err) {
      console.error('Notification pref update failed', err);
      setNotifyMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update notification preferences.' 
      });
    } finally {
      setNotifyLoading(false);
    }
  };

  if (!user) return null;

  const formattedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const isGoogleUser = user.provider === 'GOOGLE';
  const isWholesale = user.customerGroup === 'WHOLESALE';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md shadow-blue-500/20">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-gray-900">{user.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                isWholesale ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}>
                {isWholesale ? '⚡ Wholesale Partner' : 'Retail Customer'}
              </span>
              {user.role === 'ADMIN' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-200 uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {user.email}
              <span className="text-gray-300">•</span>
              <Calendar className="w-4 h-4 text-gray-400" />
              Joined {formattedDate}
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 py-2.5 px-5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-semibold text-sm shadow-sm active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'account' 
              ? 'bg-primary text-white shadow-md shadow-blue-500/20' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Account Info
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'addresses' 
              ? 'bg-primary text-white shadow-md shadow-blue-500/20' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Address Book
        </button>
        <button
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'business' 
              ? 'bg-primary text-white shadow-md shadow-blue-500/20' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Business Info
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'security' 
              ? 'bg-primary text-white shadow-md shadow-blue-500/20' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'notifications' 
              ? 'bg-primary text-white shadow-md shadow-blue-500/20' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'orders' 
              ? 'bg-primary text-white shadow-md shadow-blue-500/20' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          Orders ({orders.length})
        </button>
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. ACCOUNT INFO TAB */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            <p className="text-sm text-gray-500">Update your account name and primary contact number.</p>
          </div>

          {accountMsg && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              accountMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {accountMsg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{accountMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleAccountSubmit} className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <input 
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed outline-none pr-10"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email address is managed by your login provider and cannot be changed here.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={accountLoading}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 text-sm"
              >
                {accountLoading ? 'Saving Changes...' : 'Save Account Info'}
              </button>
            </div>
          </form>

          {/* Account Metadata Summary Cards */}
          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Account Status & Security Specs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Customer Group</span>
                <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-primary" />
                  {isWholesale ? 'Wholesale Partner' : 'Standard Retail Customer'}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Authentication Method</span>
                <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  {isGoogleUser ? 'Google OAuth2' : 'Email & Password'}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Registration Date</span>
                <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADDRESS BOOK TAB */}
      {activeTab === 'addresses' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
              <p className="text-sm text-gray-500">Manage shipping & billing destinations for quick checkout.</p>
            </div>
            <button
              onClick={handleOpenAddAddress}
              className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 text-sm active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add New Address
            </button>
          </div>

          {addressMsg && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              addressMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {addressMsg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{addressMsg.text}</span>
            </div>
          )}

          {addressesLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-900">No addresses saved yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Save your default shipping and billing addresses to streamline checkout.
              </p>
              <button
                onClick={handleOpenAddAddress}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((addr) => (
                <div key={addr.id} className="border border-gray-200 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-300 transition-all bg-white relative shadow-sm">
                  <div>
                    {/* Header line & badges */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {addr.label || 'Saved Address'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {addr.defaultShipping && (
                          <span className="bg-blue-100 text-blue-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Default Shipping
                          </span>
                        )}
                        {addr.defaultBilling && (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Default Billing
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p className="font-semibold text-gray-800">{addr.line1}</p>
                      {addr.line2 && <p>{addr.line2}</p>}
                      <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p className="text-xs text-gray-400 font-medium">{addr.country}</p>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {!addr.defaultShipping && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id, 'shipping')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Set as Default Shipping
                        </button>
                      )}
                      {!addr.defaultBilling && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id, 'billing')}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Set as Default Billing
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleOpenEditAddress(addr)}
                        className="text-xs font-bold text-gray-600 hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ADD / EDIT ADDRESS MODAL */}
          {showAddressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in border border-gray-100">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <button 
                    onClick={() => setShowAddressModal(false)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Address Label</label>
                    <input 
                      type="text"
                      placeholder="e.g. Home, Office, Main Warehouse"
                      value={addressForm.label}
                      onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                      required
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Street Address Line 1</label>
                    <input 
                      type="text"
                      placeholder="123 Main Street"
                      value={addressForm.line1}
                      onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                      required
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Address Line 2 (Optional)</label>
                    <input 
                      type="text"
                      placeholder="Suite, Apt, Unit, Building"
                      value={addressForm.line2}
                      onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">City</label>
                      <input 
                        type="text"
                        placeholder="New York"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">State / Province</label>
                      <input 
                        type="text"
                        placeholder="NY"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Postal Code</label>
                      <input 
                        type="text"
                        placeholder="10001"
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Country</label>
                      <input 
                        type="text"
                        placeholder="United States"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                      <input 
                        type="checkbox"
                        checked={addressForm.isDefaultShipping}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefaultShipping: e.target.checked })}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      Set as default shipping address
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                      <input 
                        type="checkbox"
                        checked={addressForm.isDefaultBilling}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefaultBilling: e.target.checked })}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      Set as default billing address
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(false)}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addressSubmitting}
                      className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {addressSubmitting ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. BUSINESS INFO TAB */}
      {activeTab === 'business' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Business & B2B Details</h2>
            <p className="text-sm text-gray-500">Provide company information for commercial invoices and B2B pricing verification.</p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isWholesale ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-start gap-3">
              <Building2 className={`w-5 h-5 shrink-0 mt-0.5 ${isWholesale ? 'text-amber-600' : 'text-blue-600'}`} />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">
                  {isWholesale ? 'Wholesale Partner Account Active' : 'Optional Business Information'}
                </p>
                <p className="leading-relaxed">
                  {isWholesale 
                    ? 'Your account is verified for wholesale pricing. Ensure your registered business name and Tax Identification / VAT number match your corporate tax filings.' 
                    : 'If you require tax invoices or represent a company eligible for B2B wholesale pricing, enter your registered business credentials below.'}
                </p>
              </div>
            </div>
          </div>

          {businessMsg && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              businessMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {businessMsg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{businessMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleBusinessSubmit} className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Registered Company Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input 
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Acme Corporation LLC"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tax Identification Number / VAT ID</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input 
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="XX-XXXXXXX or VAT12345678"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={businessLoading}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 text-sm"
              >
                {businessLoading ? 'Saving...' : 'Save Business Info'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Security & Authentication</h2>
            <p className="text-sm text-gray-500">Manage your account login credentials and security settings.</p>
          </div>

          {isGoogleUser ? (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-blue-950 text-base">Signed in with Google</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Your password and login security are managed directly through your Google Account. password changes cannot be performed within this platform.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl">
              {securityMsg && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                  securityMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {securityMsg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span>{securityMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
                  <input 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={securityLoading}
                    className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 text-sm"
                  >
                    {securityLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 5. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-500">Choose which updates and alerts you wish to receive via email.</p>
          </div>

          {notifyMsg && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              notifyMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {notifyMsg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{notifyMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleNotificationsSubmit} className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              {/* Order updates toggle */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-900 text-sm block">Order & Shipment Updates</span>
                  <p className="text-xs text-gray-500">Receive real-time notifications about order confirmations, invoice updates, and package tracking.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input 
                    type="checkbox"
                    checked={notifyOrderUpdates}
                    onChange={(e) => setNotifyOrderUpdates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Promotional offers toggle */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-900 text-sm block">Promotions & Exclusive Discounts</span>
                  <p className="text-xs text-gray-500">Receive promotional coupon codes, seasonal sales alerts, and wholesale partner deals.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input 
                    type="checkbox"
                    checked={notifyPromotions}
                    onChange={(e) => setNotifyPromotions(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={notifyLoading}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 text-sm"
              >
                {notifyLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order History</h2>
            <p className="text-sm text-gray-500">Review your past order receipts and item breakdowns.</p>
          </div>

          {ordersLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              You haven't placed any orders yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {orders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Order #{order.id} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                      <div className="text-xl font-extrabold text-gray-900">
                        ${order.totalAmount?.toFixed(2)}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-extrabold rounded-full border ${
                      order.status === 'DELIVERED' || order.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-700">
                          {item.quantity}x {item.product?.name || 'Product'}
                        </span>
                        <span className="font-bold text-gray-900">
                          ${(item.priceAtPurchase * item.quantity)?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Profile;
