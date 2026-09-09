import React from 'react';
import { XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Cancel = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 mb-8">Your order was not completed and you haven't been charged.</p>
        
        <Link to="/" className="block w-full bg-primary text-white font-medium py-3 px-4 rounded-xl hover:bg-primary-hover transition-colors">
          Return to Store
        </Link>
      </div>
    </div>
  );
};

export default Cancel;
