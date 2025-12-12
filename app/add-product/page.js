"use client"
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const AddProductPage = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRefs = useRef({});

    // Basic product info
    const [productData, setProductData] = useState({
        name: '',
        description: '',
        category: '',
        productType: '',
        brand: '',
    });

    // Variants with image files and previews
    const [variants, setVariants] = useState([{
        attributes: {},
        price: '',
        stockCount: '',
        salePrice: '',
        images: [], // Will store { file: File, preview: string, uploaded: string }
        sku: '',
    }]);

    // Attribute inputs for each variant
    const [attributeInputs, setAttributeInputs] = useState([{ key: '', value: '' }]);

    const categoryOptions = {
        electronics: ['laptops', 'smartphones', 'headphones', 'cameras', 'tablets', 'accessories'],
        fashion: ['men', 'women', 'kids', 'accessories', 'footwear', 'bags']
    };

    const handleProductChange = (field, value) => {
        setProductData(prev => ({ ...prev, [field]: value }));
        if (field === 'category') {
            setProductData(prev => ({ ...prev, productType: '' }));
        }
    };

    const handleVariantChange = (index, field, value) => {
        setVariants(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAttributeChange = (variantIndex, attrIndex, field, value) => {
        if (variantIndex === 0) {
            setAttributeInputs(prev => {
                const updated = [...prev];
                updated[attrIndex] = { ...updated[attrIndex], [field]: value };
                return updated;
            });
        }
    };

    const addAttributeField = () => {
        setAttributeInputs(prev => [...prev, { key: '', value: '' }]);
    };

    const removeAttributeField = (index) => {
        if (attributeInputs.length > 1) {
            setAttributeInputs(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Handle file selection
    const handleFileSelect = async (variantIndex, files) => {
        if (!files || files.length === 0) return;

        const newImages = [];
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select only image files', { position: 'top-center' });
                continue;
            }

            // Create preview URL
            const preview = URL.createObjectURL(file);
            newImages.push({ file, preview, uploaded: null });
        }

        setVariants(prev => {
            const updated = [...prev];
            updated[variantIndex] = {
                ...updated[variantIndex],
                images: [...updated[variantIndex].images, ...newImages]
            };
            return updated;
        });
    };

    const removeImage = (variantIndex, imageIndex) => {
        setVariants(prev => {
            const updated = [...prev];
            // Revoke preview URL to prevent memory leaks
            if (updated[variantIndex].images[imageIndex]?.preview) {
                URL.revokeObjectURL(updated[variantIndex].images[imageIndex].preview);
            }
            updated[variantIndex] = {
                ...updated[variantIndex],
                images: updated[variantIndex].images.filter((_, i) => i !== imageIndex)
            };
            return updated;
        });
    };

    const addVariant = () => {
        setVariants(prev => [...prev, {
            attributes: {},
            price: '',
            stockCount: '',
            salePrice: '',
            images: [],
            sku: '',
        }]);
    };

    const removeVariant = (index) => {
        if (variants.length > 1) {
            // Cleanup preview URLs
            variants[index].images.forEach(img => {
                if (img.preview) URL.revokeObjectURL(img.preview);
            });
            setVariants(prev => prev.filter((_, i) => i !== index));
        }
    };

    const generateProductId = () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6);
        return `PRD-${timestamp}-${random}`.toUpperCase();
    };

    // Upload images to server
    const uploadImages = async (images, name) => {
        if (images.length === 0) return [];

        const formData = new FormData();
        formData.append('productName', name); // Send product name for filename
        images.forEach(img => {
            if (img.file) {
                formData.append('files', img.file);
            }
        });
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload images');
        }

        const result = await response.json();
        return result.urls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate required fields
            if (!productData.name || !productData.category || !productData.productType) {
                toast.error('Please fill all required fields', { position: 'top-center' });
                setIsSubmitting(false);
                return;
            }

            // Upload all images first
            setIsUploading(true);
            const processedVariants = [];

            for (let i = 0; i < variants.length; i++) {
                const variant = variants[i];

                // Validate variant
                if (!variant.price || !variant.stockCount || !variant.sku) {
                    throw new Error(`Variant ${i + 1} is missing required fields`);
                }

                // Upload images for this variant
                let uploadedImageUrls = [];
                if (variant.images.length > 0) {
                    uploadedImageUrls = await uploadImages(variant.images, productData.name);
                }

                // Build attributes
                const attributes = {};
                if (i === 0) {
                    attributeInputs.forEach(attr => {
                        if (attr.key.trim() && attr.value.trim()) {
                            attributes[attr.key.trim().toLowerCase()] = attr.value.trim();
                        }
                    });
                }

                processedVariants.push({
                    attributes,
                    price: parseFloat(variant.price),
                    stockCount: parseInt(variant.stockCount),
                    salePrice: variant.salePrice ? parseFloat(variant.salePrice) : undefined,
                    images: uploadedImageUrls,
                    sku: variant.sku.trim(),
                });
            }

            setIsUploading(false);

            const productPayload = {
                productid: generateProductId(),
                name: productData.name.trim(),
                description: productData.description.trim(),
                category: productData.category,
                productType: productData.productType,
                brand: productData.brand.trim(),
                variants: processedVariants,
            };

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productPayload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create product');
            }

            toast.success('Product created successfully!', { position: 'top-center' });
            router.push('/');

        } catch (error) {
            console.error('Error creating product:', error);
            toast.error(error.message || 'Failed to create product', { position: 'top-center' });
            setIsUploading(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="grow">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
                        <div className="flex items-center justify-between h-12 sm:h-14 lg:h-16">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                                <div>
                                    <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Add New Product</h1>
                                    <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Fill in the product details</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
                    {/* Basic Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6">
                        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-4 sm:mb-5 flex items-center gap-2">
                            <span className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm">1</span>
                            Basic Information
                        </h2>

                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={productData.name}
                                    onChange={(e) => handleProductChange('name', e.target.value)}
                                    placeholder="e.g. Premium Wireless Headphones"
                                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={productData.description}
                                    onChange={(e) => handleProductChange('description', e.target.value)}
                                    placeholder="Describe your product..."
                                    rows={3}
                                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={productData.category}
                                        onChange={(e) => handleProductChange('category', e.target.value)}
                                        className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base bg-white"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="fashion">Fashion</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                                        Product Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={productData.productType}
                                        onChange={(e) => handleProductChange('productType', e.target.value)}
                                        className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base bg-white"
                                        required
                                        disabled={!productData.category}
                                    >
                                        <option value="">Select type</option>
                                        {productData.category && categoryOptions[productData.category]?.map(type => (
                                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                                        Brand
                                    </label>
                                    <input
                                        type="text"
                                        value={productData.brand}
                                        onChange={(e) => handleProductChange('brand', e.target.value)}
                                        placeholder="e.g. Sony, Nike"
                                        className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6">
                        <div className="flex items-center justify-between mb-4 sm:mb-5">
                            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm">2</span>
                                Variants
                            </h2>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Variant
                            </button>
                        </div>

                        {variants.map((variant, variantIndex) => (
                            <div key={variantIndex} className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 last:mb-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm sm:text-base font-medium text-gray-900">Variant {variantIndex + 1}</h3>
                                    {variants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(variantIndex)}
                                            className="text-red-500 hover:text-red-600 text-xs sm:text-sm"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                {/* Attributes - Only for first variant */}
                                {variantIndex === 0 && (
                                    <div className="mb-4">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                            Attributes (e.g. Color, Size)
                                        </label>
                                        {attributeInputs.map((attr, attrIndex) => (
                                            <div key={attrIndex} className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={attr.key}
                                                    onChange={(e) => handleAttributeChange(0, attrIndex, 'key', e.target.value)}
                                                    placeholder="Key (e.g. color)"
                                                    className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={attr.value}
                                                    onChange={(e) => handleAttributeChange(0, attrIndex, 'value', e.target.value)}
                                                    placeholder="Value (e.g. black)"
                                                    className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttributeField(attrIndex)}
                                                    className="p-2 text-gray-400 hover:text-red-500"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addAttributeField}
                                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            + Add attribute
                                        </button>
                                    </div>
                                )}

                                {/* Price, Stock, SKU */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={variant.price}
                                            onChange={(e) => handleVariantChange(variantIndex, 'price', e.target.value)}
                                            placeholder="0.00"
                                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Sale Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={variant.salePrice}
                                            onChange={(e) => handleVariantChange(variantIndex, 'salePrice', e.target.value)}
                                            placeholder="0.00"
                                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Stock *</label>
                                        <input
                                            type="number"
                                            value={variant.stockCount}
                                            onChange={(e) => handleVariantChange(variantIndex, 'stockCount', e.target.value)}
                                            placeholder="0"
                                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                                        <input
                                            type="text"
                                            value={variant.sku}
                                            onChange={(e) => handleVariantChange(variantIndex, 'sku', e.target.value)}
                                            placeholder="SKU-001"
                                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-2">Product Images</label>

                                    {/* Image Previews */}
                                    {variant.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 sm:gap-3 mb-3">
                                            {variant.images.map((img, imgIndex) => (
                                                <div key={imgIndex} className="relative group">
                                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                                        <Image
                                                            src={img.preview}
                                                            alt={`Preview ${imgIndex + 1}`}
                                                            width={80}
                                                            height={80}
                                                            className="w-full h-full object-cover"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(variantIndex, imgIndex)}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* File Input */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={el => fileInputRefs.current[variantIndex] = el}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handleFileSelect(variantIndex, e.target.files)}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRefs.current[variantIndex]?.click()}
                                            className="flex items-center gap-2 px-3 sm:px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-xs sm:text-sm"
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Upload Images</span>
                                        </button>
                                        <span className="text-xs text-gray-500">
                                            {variant.images.length} {variant.images.length === 1 ? 'image' : 'images'} selected
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="flex-1 bg-blue-600 text-white py-3 sm:py-3.5 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                        >
                            {isSubmitting || isUploading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isUploading ? 'Uploading images...' : 'Creating...'}
                                </span>
                            ) : 'Create Product'}
                        </button>
                        <Link
                            href="/dashboard"
                            className="flex-1 sm:flex-none sm:px-8 py-3 sm:py-3.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm sm:text-base text-center"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
};

export default AddProductPage;
