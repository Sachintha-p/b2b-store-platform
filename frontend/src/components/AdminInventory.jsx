import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Edit2, Trash2, Plus, Upload, X, Image as ImageIcon, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    retailPrice: '',
    wholesalePrice: '',
    stockQuantity: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Multi-image state for Add Product flow
  const [addSelectedFiles, setAddSelectedFiles] = useState([]);
  const [addFilePreviews, setAddFilePreviews] = useState([]);
  const [addCoverIndex, setAddCoverIndex] = useState(0);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryImages = async (productId) => {
    try {
      setLoadingGallery(true);
      const res = await api.get(`/products/${productId}/images`);
      setGalleryImages(res.data || []);
    } catch (err) {
      console.error("Failed to fetch gallery images", err);
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        category: product.category || '',
        description: product.description || '',
        retailPrice: product.retailPrice || '',
        wholesalePrice: product.wholesalePrice || '',
        stockQuantity: product.stockQuantity || ''
      });
      setImagePreview(product.imageUrl || null);
      fetchGalleryImages(product.id);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        retailPrice: '',
        wholesalePrice: '',
        stockQuantity: ''
      });
      setImagePreview(null);
      setGalleryImages([]);
    }
    setSelectedImage(null);
    setAddSelectedFiles([]);
    setAddFilePreviews([]);
    setAddCoverIndex(0);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setSelectedImage(null);
    setImagePreview(null);
    setGalleryImages([]);
    setAddSelectedFiles([]);
    setAddFilePreviews([]);
    setAddCoverIndex(0);
  };

  const handleAddFilesChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const combinedFiles = [...addSelectedFiles, ...newFiles];
      if (combinedFiles.length > 6) {
        alert("You can select a maximum of 6 images total.");
        return;
      }
      setAddSelectedFiles(combinedFiles);
      const newPreviews = combinedFiles.map(file => URL.createObjectURL(file));
      setAddFilePreviews(newPreviews);
    }
  };

  const handleRemoveAddFile = (index) => {
    const updatedFiles = addSelectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = addFilePreviews.filter((_, i) => i !== index);
    setAddSelectedFiles(updatedFiles);
    setAddFilePreviews(updatedPreviews);

    if (index === addCoverIndex) {
      setAddCoverIndex(0);
    } else if (index < addCoverIndex) {
      setAddCoverIndex(addCoverIndex - 1);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteImage = async () => {
    if (editingProduct && editingProduct.imageUrl) {
      try {
        await api.delete(`/admin/products/${editingProduct.id}/image`);
        setImagePreview(null);
        setSelectedImage(null);
        fetchProducts(); // Refresh list to update imageUrl to null
      } catch (err) {
        console.error("Failed to delete image", err);
        alert(err.response?.data?.message || "Failed to delete image");
      }
    } else {
      setImagePreview(null);
      setSelectedImage(null);
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!editingProduct) return;
    try {
      const res = await api.put(`/admin/products/${editingProduct.id}/images/${imageId}/set-primary`);
      setEditingProduct(res.data);
      setImagePreview(res.data.imageUrl);
      await fetchProducts();
      await fetchGalleryImages(editingProduct.id);
    } catch (err) {
      console.error("Failed to set primary image", err);
      alert(err.response?.data?.message || "Failed to set primary image");
    }
  };

  const handleDeleteGalleryImage = async (imageId) => {
    if (!editingProduct) return;
    try {
      await api.delete(`/admin/products/${editingProduct.id}/images/${imageId}`);
      await fetchGalleryImages(editingProduct.id);
      await fetchProducts();
    } catch (err) {
      console.error("Failed to delete gallery image", err);
      alert(err.response?.data?.message || "Failed to delete gallery image");
    }
  };

  const handleAddGalleryImage = async (e) => {
    if (!editingProduct || !e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const currentTotal = (editingProduct.imageUrl ? 1 : 0) + galleryImages.length;
    const remainingSlots = 6 - currentTotal;

    if (files.length > remainingSlots) {
      alert(`You can only add ${remainingSlots} more image(s), but ${files.length} were selected.`);
      e.target.value = '';
      return;
    }

    const formDataImg = new FormData();
    files.forEach(file => {
      formDataImg.append('files', file);
    });

    try {
      setUploadingGallery(true);
      await api.post(`/admin/products/${editingProduct.id}/images`, formDataImg);
      await fetchGalleryImages(editingProduct.id);
      await fetchProducts();
    } catch (err) {
      console.error("Failed to upload gallery images", err);
      alert(err.response?.data?.message || "Failed to upload gallery images");
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        retailPrice: parseFloat(formData.retailPrice),
        wholesalePrice: parseFloat(formData.wholesalePrice),
        stockQuantity: parseInt(formData.stockQuantity, 10)
      };

      if (editingProduct) {
        // Edit mode
        await api.put(`/products/${editingProduct.id}`, payload);

        if (selectedImage) {
          const formDataImage = new FormData();
          formDataImage.append('file', selectedImage);
          await api.post(`/admin/products/${editingProduct.id}/image`, formDataImage);
        }

        await fetchProducts();
        handleCloseModal();
      } else {
        // Add mode: Step 1 - create product record
        const res = await api.post('/products', payload);
        const newProduct = res.data;

        // Step 2 - upload selected images
        if (addSelectedFiles.length > 0 && newProduct?.id) {
          let coverSuccess = false;
          let gallerySuccessCount = 0;
          const totalSelected = addSelectedFiles.length;

          // Selected cover file
          const coverFile = addSelectedFiles[addCoverIndex] || addSelectedFiles[0];
          // Remaining gallery files
          const galleryFiles = addSelectedFiles.filter((_, idx) => idx !== addCoverIndex);

          // Upload cover image
          try {
            console.log(`[COVER UPLOAD] Uploading cover image for Product #${newProduct.id}:`, coverFile.name);
            const coverForm = new FormData();
            coverForm.append('file', coverFile);
            await api.post(`/admin/products/${newProduct.id}/image`, coverForm);
            coverSuccess = true;
          } catch (err) {
            console.error(`[COVER UPLOAD FAILED] Product #${newProduct.id} cover file '${coverFile.name}' failed to upload:`, {
              status: err.response?.status,
              statusText: err.response?.statusText,
              responseBody: err.response?.data,
              file: coverFile.name
            });
          }

          // Upload remaining gallery images in 1 batch call
          if (galleryFiles.length > 0) {
            try {
              console.log(`[GALLERY BATCH UPLOAD] Uploading ${galleryFiles.length} gallery images for Product #${newProduct.id}...`);
              const galleryForm = new FormData();
              galleryFiles.forEach(file => {
                galleryForm.append('files', file);
              });
              const galRes = await api.post(`/admin/products/${newProduct.id}/images`, galleryForm);
              if (galRes.data) {
                gallerySuccessCount = galRes.data.length;
              }
            } catch (err) {
              console.error(`[GALLERY BATCH UPLOAD FAILED] Product #${newProduct.id} gallery batch failed (Status ${err.response?.status}):`, {
                status: err.response?.status,
                statusText: err.response?.statusText,
                responseBody: err.response?.data,
                failedFiles: galleryFiles.map(f => f.name)
              });

              // Sequential single-file fallback to capture per-file failure details
              for (let i = 0; i < galleryFiles.length; i++) {
                const singleFile = galleryFiles[i];
                try {
                  const singleForm = new FormData();
                  singleForm.append('file', singleFile);
                  const singleRes = await api.post(`/admin/products/${newProduct.id}/images`, singleForm);
                  if (singleRes.data) {
                    gallerySuccessCount++;
                  }
                } catch (singleErr) {
                  console.error(`[GALLERY SINGLE UPLOAD FAILED] Image ${i+1}/${galleryFiles.length} '${singleFile.name}' failed:`, {
                    status: singleErr.response?.status,
                    statusText: singleErr.response?.statusText,
                    responseBody: singleErr.response?.data,
                    fileName: singleFile.name,
                    fileSize: singleFile.size,
                    fileType: singleFile.type
                  });
                }
              }
            }
          }

          const totalSuccess = (coverSuccess ? 1 : 0) + gallerySuccessCount;
          if (totalSuccess < totalSelected) {
            alert(`Product created successfully, but ${totalSelected - totalSuccess} of ${totalSelected} images failed to upload. You can retry uploading from the Edit Product modal.`);
          }
        }

        await fetchProducts();
        handleCloseModal();
      }
    } catch (err) {
      console.error("Failed to save product", err);
      alert(err.response?.data?.message || "Failed to save product. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${id}`);
        await fetchProducts();
      } catch (err) {
        console.error("Failed to delete product", err);
        alert("Failed to delete product");
      }
    }
  };

  const lowStockProducts = products.filter(p => p.stockQuantity < 5);

  return (
    <div className="space-y-8">
      {/* Header and Nav */}
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

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900">Inventory Status</h3>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Image</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Product Name</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Stock Level</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">Loading inventory...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">No products found.</td>
                </tr>
              ) : (
                products.map(product => {
                  const isLow = product.stockQuantity < 5;
                  const isZero = product.stockQuantity === 0;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-gray-500 text-sm">#{product.id}</td>
                      <td className="p-4">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </td>
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
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Image Upload & Gallery Section */}
              <div className="space-y-4 border-b border-gray-100 pb-6">
                {!editingProduct ? (
                  /* ADD PRODUCT MULTI-IMAGE SECTION */
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Product Images <span className="text-xs font-normal text-gray-500">(Click "Set Cover" on any image to make it primary, up to 6 total)</span>
                      </label>
                      <span className="text-xs font-medium text-gray-500">
                        {addSelectedFiles.length}/6 selected
                      </span>
                    </div>

                    {addFilePreviews.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-6 gap-3">
                          {addFilePreviews.map((preview, index) => {
                            const isCover = index === addCoverIndex;
                            return (
                              <div key={index} className={`relative group aspect-square rounded-xl overflow-hidden border-2 ${isCover ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20' : 'border-gray-200'} bg-gray-50`}>
                                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                {isCover && (
                                  <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5 z-10">
                                    <Star className="w-2.5 h-2.5 fill-current" /> Cover
                                  </span>
                                )}
                                
                                {/* Overlay controls */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 z-20">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => setAddCoverIndex(index)}
                                      className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-black/50 hover:bg-amber-500 hover:text-white px-2 py-1 rounded-md transition-colors w-full justify-center"
                                      title="Set as Primary Cover Image"
                                    >
                                      <Star className="w-3 h-3 fill-current" />
                                      <span>Set Cover</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAddFile(index)}
                                    className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-black/50 hover:bg-red-500 hover:text-white px-2 py-1 rounded-md transition-colors w-full justify-center"
                                    title="Remove Image"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {addSelectedFiles.length < 6 && (
                          <label className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-50 border border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-600">
                            <Plus className="w-4 h-4 text-gray-500" />
                            <span>Add more images ({6 - addSelectedFiles.length} remaining)</span>
                            <input 
                              type="file" 
                              accept="image/jpeg, image/png, image/webp"
                              multiple
                              className="hidden" 
                              onChange={handleAddFilesChange}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 w-full p-6 bg-white border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary transition-colors text-sm font-medium text-gray-600">
                        <Upload className="w-8 h-8 text-gray-400 mb-1" />
                        <span className="font-semibold text-gray-900">Click to select images</span>
                        <span className="text-xs text-gray-500">Select up to 6 images at once. JPEG, PNG or WebP. Max 5MB per file.</span>
                        <input 
                          type="file" 
                          accept="image/jpeg, image/png, image/webp"
                          multiple
                          className="hidden" 
                          onChange={handleAddFilesChange}
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  /* EDIT PRODUCT IMAGE SECTION */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cover Image <span className="text-xs font-normal text-gray-500">(Primary display image)</span>
                      </label>
                      <div className="flex items-center gap-6">
                        <div className="shrink-0">
                          {imagePreview ? (
                            <div className="relative group">
                              <img src={imagePreview} alt="Preview" className="w-28 h-28 object-cover rounded-xl border border-gray-200 shadow-sm" />
                              <button 
                                type="button"
                                onClick={handleDeleteImage}
                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl font-medium text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="w-28 h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
                              <ImageIcon className="w-8 h-8 mb-1" />
                              <span className="text-xs">No Cover</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary transition-colors text-sm font-medium text-gray-600">
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span>Upload cover image</span>
                            <input 
                              type="file" 
                              accept="image/jpeg, image/png, image/webp"
                              className="hidden" 
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">JPEG, PNG or WebP. Max 5MB.</p>
                        </div>
                      </div>
                    </div>

                    {/* Gallery Section */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Product Gallery</label>
                          <p className="text-xs text-gray-500">
                            Additional images for product detail view ({galleryImages.length + (editingProduct.imageUrl ? 1 : 0)}/6 total)
                          </p>
                        </div>
                        
                        {/* Add Gallery Image Button (Multi-select) */}
                        {galleryImages.length + (editingProduct.imageUrl ? 1 : 0) < 6 ? (
                          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                            {uploadingGallery ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingGallery ? 'Uploading...' : 'Add Images'}</span>
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/webp"
                              multiple
                              className="hidden"
                              disabled={uploadingGallery}
                              onChange={handleAddGalleryImage}
                            />
                          </label>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                            Gallery Limit Reached (Max 6)
                          </span>
                        )}
                      </div>

                      {loadingGallery ? (
                        <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span>Loading gallery images...</span>
                        </div>
                      ) : galleryImages.length === 0 ? (
                        <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                          No additional gallery images. Click "Add Images" above to add gallery thumbnails.
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-3">
                          {galleryImages.map((img) => (
                            <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                              <img src={img.imageUrl} alt="Gallery" className="w-full h-full object-cover" />
                              
                              {/* Overlay controls */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(img.id)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-black/50 hover:bg-amber-500 hover:text-white px-2 py-1 rounded-md transition-colors w-full justify-center"
                                  title="Promote to Primary Cover"
                                >
                                  <Star className="w-3 h-3 fill-current" />
                                  <span>Set Cover</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGalleryImage(img.id)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-black/50 hover:bg-red-500 hover:text-white px-2 py-1 rounded-md transition-colors w-full justify-center"
                                  title="Delete Gallery Image"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="E.g. Premium Office Chair"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="E.g. Furniture"
                  />
                </div>
                
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <span className={`text-xs ${formData.description.length >= 2000 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                      {formData.description.length}/2000 characters
                    </span>
                  </div>
                  <textarea
                    rows="4"
                    maxLength={2000}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y"
                    placeholder="Detailed product description..."
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({...formData, retailPrice: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wholesale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({...formData, wholesalePrice: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
