"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from "next-auth/react";

const Navbar = () => {
    const { data: session } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    const categories = [
        { name: 'Fashion', items: ['Men', 'Women', 'Kids', 'Accessories'] },
        { name: 'Electronics', items: ['Laptops', 'Smartphones', 'Headphones', 'Cameras'] },
    ];

    // Debounced search function
    const handleSearch = useCallback(async (searchTerm) => {
        if (!searchTerm.trim()) {
            setFilteredProducts([]);
            return;
        }

        setIsSearching(true);
        try {
            const search = await fetch(`/api/products`);
            const response = await search.json();
            const term = searchTerm.toLowerCase();

            const filtered = response.filter(item =>
                item.name?.toLowerCase().includes(term) ||
                item.description?.toLowerCase().includes(term)
            );

            setFilteredProducts(filtered);
        } catch (error) {
            console.error("Search error:", error);
            setFilteredProducts([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Handle input change with debounce
    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout for debounced search
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(value);
        }, 300);
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        setFilteredProducts([]);
    };

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setFilteredProducts([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Close mobile menu when route changes
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
        setIsDropdownOpen(null);
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-3 justify-between h-14 sm:h-16">
                    {/* Logo */}
                    <div className="flex items-center shrink-0">
                        <Link href={'/'} onClick={closeMobileMenu}>
                            <h1 className="text-xl sm:text-2xl font-bold text-blue-600 cursor-pointer">
                                ShopLux
                            </h1>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex justify-between space-x-6 xl:space-x-8">
                        {categories.map((category) => (
                            <div
                                key={category.name}
                                className="relative group"
                                onMouseEnter={() => setIsDropdownOpen(category.name)}
                                onMouseLeave={() => setIsDropdownOpen(null)}
                            >
                                <Link href={`/products/${category.name}/all`}>
                                    <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 py-2">
                                        <span>{category.name}</span>
                                        <svg className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen === category.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </Link>

                                {/* Dropdown */}
                                <div className={`absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 transition-all duration-300 transform origin-top ${isDropdownOpen === category.name
                                    ? 'opacity-100 visible scale-y-100 translate-y-0'
                                    : 'opacity-0 invisible scale-y-95 -translate-y-2'
                                    }`}>
                                    <div className="py-2">
                                        {category.items.map((item, index) => (
                                            <Link
                                                key={item}
                                                href={`/products/${category.name}/${item}`}
                                                className={`block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 ${isDropdownOpen === category.name
                                                    ? 'translate-x-0 opacity-100'
                                                    : 'translate-x-2 opacity-0'
                                                    }`}
                                                style={{
                                                    transitionDelay: isDropdownOpen === category.name ? `${index * 50}ms` : '0ms'
                                                }}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search Bar - Desktop */}
                    <div ref={searchRef} className="hidden lg:flex flex-1 max-w-md xl:max-w-lg mx-4 xl:mx-8 relative">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                                placeholder="Search products..."
                                className="w-full pl-10 pr-10 py-2.5 border text-gray-900 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            <svg className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label="Clear search"
                                    title="Clear search"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[70vh] overflow-hidden z-50">
                                {isSearching ? (
                                    <div className="p-6 text-center">
                                        <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm text-gray-500 mt-2">Searching...</p>
                                    </div>
                                ) : filteredProducts.length > 0 ? (
                                    <>
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                            <p className="text-sm text-gray-600">
                                                Found <span className="font-semibold text-gray-900">{filteredProducts.length}</span> result(s)
                                            </p>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {filteredProducts.slice(0, 8).map((product) => (
                                                <Link
                                                    key={product._id || product.productid}
                                                    href={`/product/${product.productid}`}
                                                    onClick={clearSearch}
                                                    className="flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                                                >
                                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                        {product.variants?.[0]?.images?.[0] ? (
                                                            <Image
                                                                height={56}
                                                                width={56}
                                                                src={product.variants[0].images[0]}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-gray-900 text-sm truncate">
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                                            {product.category}
                                                        </p>
                                                        {product.variants?.[0]?.price && (
                                                            <p className="text-sm font-semibold text-blue-600 mt-1">
                                                                ${product.variants[0].price}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                        {filteredProducts.length > 8 && (
                                            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-center">
                                                <p className="text-sm text-gray-500">
                                                    +{filteredProducts.length - 8} more results
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-6 text-center">
                                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <p className="text-gray-500">No products found</p>
                                        <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center space-x-1 sm:space-x-3">
                        {/* User Account */}
                        {/* User Account Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
                                className="p-2 text-gray-600 hover:text-blue-600 transition-all duration-200 hover:bg-blue-50 rounded-full"
                                aria-label="Account"
                                title="Account"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            <div className={`absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 transition-all duration-200 transform origin-top-right z-50 ${isProfileOpen
                                ? 'opacity-100 visible scale-100 translate-y-0'
                                : 'opacity-0 invisible scale-95 -translate-y-2'
                                }`}>
                                <div className="py-2">
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        My Orders
                                    </Link>
                                    <Link
                                        href="/dashboard/profile"
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        My Profile
                                    </Link>
                                    {session?.user?.role === 'admin' && (
                                        <Link
                                            href="/add-product"
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Product
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shopping Cart */}
                        <Link href={"/my-cart"}>
                            <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-all duration-200 hover:bg-blue-50 rounded-full" aria-label="Cart" title="Cart">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293A1 1 0 005 16v0a1 1 0 001 1h11M7 13v4a2 2 0 002 2h4a2 2 0 002-2v-4" />
                                </svg>
                            </button>
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                            title={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white border-t border-gray-200">
                    <div className="px-4 py-4">

                        {/* Mobile Search */}
                        <div className="mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchInputChange}
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <svg className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-3 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label="Clear search"
                                        title="Clear search"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Mobile Search Results */}
                            {searchQuery && filteredProducts.length > 0 && (
                                <div className="mt-3 bg-gray-50 rounded-xl p-2 max-h-60 overflow-y-auto">
                                    {filteredProducts.slice(0, 5).map((product) => (
                                        <Link
                                            key={product._id || product.productid}
                                            href={`/product/${product.productid}`}
                                            onClick={() => {
                                                clearSearch();
                                                closeMobileMenu();
                                            }}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                                                {product.variants?.[0]?.images?.[0] && (
                                                    <Image
                                                        height={40}
                                                        width={40}
                                                        src={product.variants[0].images[0]}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                        unoptimized
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                                {product.variants?.[0]?.price && (
                                                    <p className="text-xs font-semibold text-blue-600">${product.variants[0].price}</p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mobile Categories */}
                        <div className="space-y-1">
                            {categories.map((category) => (
                                <div key={category.name} className="border-b border-gray-100 last:border-b-0">
                                    <button
                                        onClick={() => setIsDropdownOpen(isDropdownOpen === category.name ? null : category.name)}
                                        className="w-full flex items-center justify-between py-3 text-left text-gray-700 hover:text-blue-600 transition-colors duration-200"
                                    >
                                        <span className="font-medium">{category.name}</span>
                                        <svg className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen === category.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDropdownOpen === category.name ? 'max-h-60 opacity-100 pb-2' : 'max-h-0 opacity-0'}`}>
                                        <Link
                                            href={`/products/${category.name}/all`}
                                            onClick={closeMobileMenu}
                                            className="block pl-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                        >
                                            View All {category.name}
                                        </Link>
                                        {category.items.map((item) => (
                                            <Link
                                                key={item}
                                                href={`/products/${category.name}/${item}`}
                                                onClick={closeMobileMenu}
                                                className="block pl-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </nav >
    );
};

export default Navbar;