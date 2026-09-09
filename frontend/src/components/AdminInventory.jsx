import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const lowStockProducts = products.filter(p => p.stockQuantity < 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
        <Link to="/admin/orders" className="text-gray-500 hover:text-gray-900 font-medium">Orders</Link>
        <span className="text-gray-300">|</span>
        <Link to="/admin/coupons" className="text-gray-500 hover:text-gray-900 font-medium">Coupons</Link>
        <span className="text-gray-300">|</span>
        <Link to="/admin/inventory" className="text-primary font-bold border-b-2 border-primary pb-4 -mb-[17px]">Inventory</Link>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800">Low-Stock Warning</h3>
            <p className="text-red-600 text-sm mt-1">
              You have {lowStockProducts.length} product(s) with fewer than 5 units remaining in stock.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-bold text-gray-900">Inventory Status</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Product Name</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Stock Level</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">Loading inventory...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No products found.</td>
                </tr>
              ) : (
                products.map(product => {
                  const isLow = product.stockQuantity < 5;
                  const isZero = product.stockQuantity === 0;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-gray-500 text-sm">#{product.id}</td>
                      <td className="p-4 font-semibold text-gray-900">{product.name}</td>
                      <td className="p-4 text-sm text-gray-500">{product.category || 'N/A'}</td>
                      <td className="p-4 text-right font-medium">
                        <span className={isZero ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-gray-900'}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="p-4">
                        {isZero ? (
                          <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md border border-red-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-md border border-orange-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md border border-green-200">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
