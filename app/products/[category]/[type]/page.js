"use client"
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import LoadingScreen from '@/components/LoadingScreen';
import React, { useState, useEffect, use, useCallback } from 'react';

const CategoryWiseProducts = ({ params }) => {
    const paramsData = use(params);
    const type = decodeURIComponent(paramsData.type);
    const Category = decodeURIComponent(paramsData.category.toLocaleLowerCase());
    const [activeCategory, setActiveCategory] = useState((type).toLocaleLowerCase());
    const [isLoading, setIsLoading] = useState(true);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [products, setproducts] = useState([]);
    const [categories, setcategories] = useState([]);
    const [reviews, setReviews] = useState([]);

    // Filter states
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    // Calculate average rating for a product (memoized)
    const getAvgRating = useCallback((productId) => {
        const productReviews = reviews.filter(r => r.productId === productId);
        if (productReviews.length === 0) return 0;
        return productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    }, [reviews]);

    useEffect(() => {
        const gettheproducts = async () => {
            const allproducts = await fetch(`/api/products`);
            const response = await allproducts.json();
            setproducts(response.filter(items => items.category.toLowerCase() === Category));

            // Fetch reviews
            const reviewsRes = await fetch('/api/review');
            const reviewsData = await reviewsRes.json();
            setReviews(reviewsData);
        };
        gettheproducts();
    }, [Category]);

    useEffect(() => {
        setActiveCategory(type.toLowerCase());
    }, [type]);

    useEffect(() => {
        if (Category === "fashion") {
            setcategories([
                { id: 'all', name: 'All Collections', count: products.length },
                { id: 'men', name: 'Men', count: products.filter(p => p.productType === 'men').length },
                { id: 'women', name: 'Women', count: products.filter(p => p.productType === 'women').length },
                { id: 'kids', name: 'Kids', count: products.filter(p => p.productType === 'kids').length },
                { id: 'accessories', name: 'Accessories', count: products.filter(p => p.productType === 'accessories').length }
            ]);
        } else {
            setcategories([
                { id: 'all', name: 'All Electronics', count: products.length },
                { id: 'laptops', name: 'Laptops', count: products.filter(p => p.productType === 'laptops').length },
                { id: 'smartphones', name: 'Smartphones', count: products.filter(p => p.productType === 'smartphones').length },
                { id: 'headphones', name: 'Headphones', count: products.filter(p => p.productType === 'headphones').length },
                { id: 'cameras', name: 'Cameras', count: products.filter(p => p.productType === 'cameras').length },
            ]);
        }
    }, [products, activeCategory, Category]);

    // Apply filters and sorting
    useEffect(() => {
        setIsLoading(true);

        setTimeout(() => {
            let filtered = activeCategory === 'all'
                ? [...products]
                : products.filter(product => product.productType === activeCategory);

            // Apply price filter
            if (minPrice !== '') {
                filtered = filtered.filter(p => p.variants[0].price >= parseFloat(minPrice));
            }
            if (maxPrice !== '') {
                filtered = filtered.filter(p => p.variants[0].price <= parseFloat(maxPrice));
            }

            // Apply in-stock filter
            if (inStockOnly) {
                filtered = filtered.filter(p => p.variants[0].stockCount > 0);
            }

            // Apply sorting
            switch (sortBy) {
                case 'price-low':
                    filtered.sort((a, b) => a.variants[0].price - b.variants[0].price);
                    break;
                case 'price-high':
                    filtered.sort((a, b) => b.variants[0].price - a.variants[0].price);
                    break;
                case 'rating':
                    filtered.sort((a, b) => getAvgRating(b._id) - getAvgRating(a._id));
                    break;
                case 'newest':
                    // Sort by _id descending (assuming newer products have higher IDs)
                    filtered.sort((a, b) => b._id.localeCompare(a._id));
                    break;
                case 'most-reviews':
                    filtered.sort((a, b) => {
                        const aReviews = reviews.filter(r => r.productId === a._id).length;
                        const bReviews = reviews.filter(r => r.productId === b._id).length;
                        return bReviews - aReviews;
                    });
                    break;
                default:
                    break;
            }

            setFilteredProducts(filtered);
            setIsLoading(false);
        }, 300);
    }, [products, activeCategory, minPrice, maxPrice, inStockOnly, sortBy, reviews, getAvgRating]);

    // Count active filters
    useEffect(() => {
        let count = 0;
        if (minPrice !== '') count++;
        if (maxPrice !== '') count++;
        if (inStockOnly) count++;
        if (sortBy !== 'default') count++;
        setActiveFiltersCount(count);
    }, [minPrice, maxPrice, inStockOnly, sortBy]);

    const handleCategoryChange = (type) => {
        setActiveCategory(type);
    };

    const clearFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setInStockOnly(false);
        setSortBy('default');
    };

    const applyFilters = () => {
        setShowFilterModal(false);
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
                    {/* Header Section */}
                    <div className="text-center mb-6 sm:mb-8 lg:mb-12">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4 capitalize">{Category} Collections</h1>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600">Discover the latest in {Category === 'electronics' ? 'technology and innovation' : 'style and fashion'}</p>
                    </div>

                    {/* Category Filter + Filter Button Row */}
                    <div className="mb-4 sm:mb-6 lg:mb-8">
                        {/* Mobile: Category select + Filter button */}
                        <div className="flex sm:hidden gap-2 px-1">
                            <select
                                value={activeCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{`${cat.name} (${cat.count})`}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors relative"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filter
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Desktop: Horizontal pills + Filter button */}
                        <div className="hidden sm:flex items-center justify-between gap-4">
                            <div className="flex items-center overflow-x-auto gap-2 md:gap-3 py-1 scrollbar-hide">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategoryChange(category.id)}
                                        className={`inline-flex whitespace-nowrap items-center px-3 md:px-4 lg:px-5 py-2 md:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 ${activeCategory === category.id
                                            ? 'bg-gray-900 text-white shadow-lg'
                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                            }`}
                                    >
                                        <span>{category.name}</span>
                                        <span className="ml-1.5 text-xs opacity-70">({category.count})</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className="shrink-0 flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 md:py-2.5 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all relative"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span className="hidden md:inline">Filters</span>
                                {activeFiltersCount > 0 && (
                                    <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Active filters chips */}
                    {activeFiltersCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
                            <span className="text-xs sm:text-sm text-gray-500">Active filters:</span>
                            {minPrice !== '' && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs sm:text-sm">
                                    Min: ${minPrice}
                                    <button onClick={() => setMinPrice('')} className="hover:text-blue-900" aria-label="Remove minimum price filter" title="Remove minimum price filter">×</button>
                                </span>
                            )}
                            {maxPrice !== '' && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs sm:text-sm">
                                    Max: ${maxPrice}
                                    <button onClick={() => setMaxPrice('')} className="hover:text-blue-900" aria-label="Remove maximum price filter" title="Remove maximum price filter">×</button>
                                </span>
                            )}
                            {inStockOnly && (
                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs sm:text-sm">
                                    In Stock
                                    <button onClick={() => setInStockOnly(false)} className="hover:text-green-900" aria-label="Remove in stock filter" title="Remove in stock filter">×</button>
                                </span>
                            )}
                            {sortBy !== 'default' && (
                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs sm:text-sm">
                                    {sortBy === 'price-low' && 'Price: Low to High'}
                                    {sortBy === 'price-high' && 'Price: High to Low'}
                                    {sortBy === 'rating' && 'Best Rated'}
                                    {sortBy === 'newest' && 'Newest First'}
                                    {sortBy === 'most-reviews' && 'Most Reviewed'}
                                    <button onClick={() => setSortBy('default')} className="hover:text-purple-900" aria-label="Remove sort filter" title="Remove sort filter">×</button>
                                </span>
                            )}
                            <button onClick={clearFilters} className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium ml-2">
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* Products Grid */}
                    <div className="relative">
                        {isLoading && (
                            <LoadingScreen
                                fullScreen={false}
                                message=""
                                className="absolute inset-0 z-20 bg-white/75! rounded-xl min-h-0!"
                            />
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                            {filteredProducts.map((product, index) => {
                                const avgRating = getAvgRating(product._id);
                                return (
                                    <Link href={`/product/${product._id}`} key={product._id}>
                                        <div
                                            className="group bg-white rounded-xl sm:rounded-2xl shadow-sm sm:shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg sm:hover:shadow-xl hover:-translate-y-1 h-full"
                                            style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both` }}
                                        >
                                            <div className="relative overflow-hidden aspect-square">
                                                {(() => {
                                                    const productImage = product.variants?.[0]?.images?.[0];
                                                    const productSlug = product.name?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                                    const imageSrc = productImage || `/uploads/products/${productSlug}.png`;
                                                    return (
                                                        <Image
                                                            width={500}
                                                            height={500}
                                                            src={imageSrc}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            unoptimized={imageSrc?.startsWith('/uploads')}
                                                        />
                                                    );
                                                })()}
                                                {/* Stock badge */}
                                                {product.variants[0].stockCount <= 0 && (
                                                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                                                        Out of Stock
                                                    </div>
                                                )}
                                                {product.variants[0].stockCount > 0 && product.variants[0].stockCount <= 5 && (
                                                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                                                        Low Stock
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3 sm:p-4 lg:p-5">
                                                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5em]">
                                                    {product.name}
                                                </h3>

                                                {/* Brand */}
                                                <p className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2 truncate">{product.brand}</p>

                                                {/* Rating */}
                                                <div className="flex items-center gap-1 mb-2 sm:mb-3">
                                                    <div className="flex items-center">
                                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs sm:text-sm text-gray-600">
                                                        {avgRating.toFixed(1)}
                                                    </span>
                                                </div>

                                                {/* Price */}
                                                <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                                                    <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                                                        ${product.variants[0].price}
                                                    </span>
                                                    {product.variants[0].salePrice && (
                                                        <span className="text-xs sm:text-sm text-gray-500 line-through">
                                                            ${product.variants[0].salePrice}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Empty state */}
                    {filteredProducts.length === 0 && !isLoading && (
                        <div className="text-center py-12 sm:py-16">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No products found</h3>
                            <p className="text-sm sm:text-base text-gray-500 mb-4">Try adjusting your filters or selecting a different category.</p>
                            {activeFiltersCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div
                        className="bg-white w-full sm:w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-slide-up sm:animate-fade-in"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Filters & Sorting</h2>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                aria-label="Close filter modal"
                                title="Close filter modal"
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-5 space-y-5 sm:space-y-6 overflow-y-auto max-h-[60vh]">
                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Sort By</label>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    {[
                                        { value: 'default', label: 'Default' },
                                        { value: 'newest', label: 'Newest First' },
                                        { value: 'rating', label: 'Best Rated ⭐' },
                                        { value: 'most-reviews', label: 'Most Reviewed' },
                                        { value: 'price-low', label: 'Price: Low → High' },
                                        { value: 'price-high', label: 'Price: High → Low' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setSortBy(option.value)}
                                            className={`px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all border-2 active:scale-95 ${sortBy === option.value
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Price Range</label>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(e.target.value)}
                                                className="w-full pl-7 pr-3 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-gray-400">—</span>
                                    <div className="flex-1">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                className="w-full pl-7 pr-3 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* In Stock Only */}
                            <div>
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-sm font-semibold text-gray-900">In Stock Only</span>
                                    <div
                                        onClick={() => setInStockOnly(!inStockOnly)}
                                        className={`relative w-11 h-6 sm:w-12 sm:h-7 rounded-full transition-colors ${inStockOnly ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div className={`absolute top-0.5 sm:top-1 w-5 h-5 sm:w-5 sm:h-5 bg-white rounded-full shadow transition-transform ${inStockOnly ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5 sm:translate-x-1'
                                            }`}></div>
                                    </div>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Show only products that are currently available</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 flex gap-3">
                            <button
                                onClick={clearFilters}
                                className="flex-1 py-2.5 sm:py-3 px-4 border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={applyFilters}
                                className="flex-1 py-2.5 sm:py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animations & Scrollbar styles */}
            <style jsx global>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </>
    );
};

export default CategoryWiseProducts;