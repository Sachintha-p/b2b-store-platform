import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCircle, LogOut, Package, Settings, Shield } from 'lucide-react';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  if (!user) {
    return (
      <Link 
        to="/login" 
        className="text-primary/80 hover:text-primary transition-colors flex items-center gap-1"
        title="Sign In"
      >
        <UserCircle className="w-6 h-6" />
      </Link>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:bg-primary-hover transition-colors"
        title="Account Menu"
      >
        {getInitials(user.name)}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
            {user.role === 'ADMIN' && (
              <div className="mt-2 inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                <Shield className="w-3 h-3" />
                Admin Account
              </div>
            )}
          </div>

          {/* Links */}
          <div className="py-1">
            <Link 
              to="/profile" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
            >
              <Package className="w-4 h-4" />
              My Orders
            </Link>
            <Link 
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
