"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useSession } from "next-auth/react"
import Image from 'next/image';
import LoadingScreen from '@/components/LoadingScreen';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CartPage = () => {
    const { data, status } = useSession();
    const [cartItems, setCartItems] = useState([]);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [limit, setlimit] = useState({})
    const [refresh, setrefresh] = useState(true)
    const [promoApplied, setPromoApplied] = useState(false);
    const loading = status === 'loading';

    // Calculate totals
    const subtotal = cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const savings = cartItems?.reduce((sum, item) => sum + ((item.originalPrice - item.price) * item.quantity), 0);
    const tax = (subtotal * 0.0875);
    const total = subtotal + tax - discount;
    const router = useRouter()

    const updateQuantity = async (id, newQuantity, stock) => {
        setrefresh(pre => !pre)
        if (newQuantity <= 0) return;
        if (newQuantity > stock) {
            setlimit(prev => ({ ...prev, [id]: true }));
            return;
        }
        setlimit(prev => ({ ...prev, [id]: false }));

        try {
            const response = await fetch(`/api/cart/${data.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQuantity, id: id })
            });
            if (!response.ok) throw new Error('Failed to update quantity');
            const updatedItem = await response.json();
            if (updatedItem.success) {
                setCartItems(items =>
                    items.map(item =>
                        item.id === id ? { ...item, quantity: newQuantity } : item
                    )
                );
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            setCartItems(items =>
                items.map(item =>
                    item.id === id ? { ...item, quantity: item.quantity } : item
                )
            );
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            const getcartinfo = async () => {
                const cart = await fetch(`/api/cart/${data?.user.id}`)
                const response = await cart.json()
                setCartItems(response)
            }
            getcartinfo()
        }
    }, [refresh, status, data]);

    useEffect(() => {
        setrefresh(prev => !prev)
    }, [])

    const removeItem = async (productId, selectedVariant) => {
        try {
            const requestOptions = {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, selectedVariant }),
            };
            await fetch(`/api/cart/${data.user.id}`, requestOptions);
            toast.success("Item removed from cart", { position: "top-center" });
            setrefresh(prev => !prev)
        } catch (error) {
            toast.error("Something went wrong");
            console.error("Error:", error);
        }
    };

    const applyPromoCode = () => {
        const code = promoCode.toUpperCase();
        if (code === 'SAVE15') {
            setDiscount(subtotal * 0.15);
            setPromoApplied(true);
            toast.success("Promo code applied!", { position: "top-center" });
        } else if (code === 'NEWCUSTOMER25') {
            setDiscount(25);
            setPromoApplied(true);
            toast.success("Promo code applied!", { position: "top-center" });
        } else {
            toast.error("Invalid promo code", { position: "top-center" });
        }
    };

    const removePromo = () => {
        setDiscount(0);
        setPromoApplied(false);
        setPromoCode('');
    };

    const handleback = () => {
        router.back()
    }

    if (loading || !data || !data.user) {
        return <LoadingScreen message="Loading your cart..." />;
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="grow container mx-auto px-3 sm:px-4 py-10 sm:py-16 lg:py-20 flex flex-col items-center justify-center">
                    <div className="max-w-md w-full text-center bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-sm border border-gray-200">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <svg className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">Your cart is empty</h2>
                        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                            Start adding items to your cart to see them here.
                        </p>
                        <button onClick={handleback} className="w-full sm:w-auto bg-gray-900 text-white px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-gray-800 active:bg-gray-950 transition-colors text-sm sm:text-base">
                            Continue Shopping
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-black bg-gray-50 flex flex-col">
            <Navbar />

            <main className="grow container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">Shopping Cart</h1>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
                    </div>
                    {savings > 0 && (
                        <div className="bg-green-50 text-green-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium self-start sm:self-auto">
                            You saved ${savings.toFixed(2)}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 xl:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {cartItems.map((item, index) => (
                                <div key={item._id} className={`p-3 sm:p-4 lg:p-6 ${index !== cartItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <div className="flex gap-3 sm:gap-4 lg:gap-6">
                                        {/* Product Image */}
                                        <Link href={`/product/${item.productId}`} className="shrink-0">
                                            <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    width={144}
                                                    height={144}
                                                    className="object-cover w-full h-full"
                                                    unoptimized={item.image?.startsWith('/uploads')}
                                                />
                                            </div>
                                        </Link>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-500 mb-0.5">{item.brand}</p>
                                                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2">{item.name}</h3>

                                                    {/* Specs - Horizontal scroll on mobile */}
                                                    <div className="flex gap-1.5 sm:gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                                                        {Object.entries(item.selectedVariant).map(([key, value]) => (
                                                            <div key={key} className="shrink-0 flex items-center gap-1 sm:gap-1.5 bg-blue-50 border border-blue-100 px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg">
                                                                <span className="font-medium text-gray-700 capitalize text-[10px] sm:text-xs">{key}:</span>
                                                                <span className="text-blue-600 font-semibold text-[10px] sm:text-xs">{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Stock Warning */}
                                                    {limit[item._id] && (
                                                        <div className="flex items-center gap-1 text-amber-600 text-[10px] sm:text-xs bg-amber-50 px-2 py-1 sm:py-1.5 rounded-md border border-amber-100 w-fit">
                                                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            <span>Only {item.stockCount} left</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => removeItem(item.productId, item.selectedVariant)}
                                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors shrink-0"
                                                    aria-label="Remove item"
                                                    title="Remove item"
                                                >
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Bottom Controls */}
                                            <div className="flex items-center justify-between pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-gray-100">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <span className="text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">Qty:</span>
                                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.stockCount)}
                                                            className="p-2 sm:p-2.5 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50"
                                                            disabled={item.quantity <= 1}
                                                            aria-label="Decrease quantity"
                                                            title="Decrease quantity"
                                                        >
                                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                            </svg>
                                                        </button>
                                                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 font-medium text-sm sm:text-base min-w-[40px] sm:min-w-[50px] text-center bg-gray-50">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.stockCount)}
                                                            className="p-2 sm:p-2.5 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                                            aria-label="Increase quantity"
                                                            title="Increase quantity"
                                                        >
                                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="text-right">
                                                    <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                                                        ${(item.price).toFixed(2)}
                                                    </div>
                                                    {item.originalPrice > item.price && (
                                                        <div className="text-[10px] sm:text-xs lg:text-sm text-gray-500 line-through">
                                                            ${(item.originalPrice).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Promo Code Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mt-4 sm:mt-6">
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Promo Code</h3>
                            {!promoApplied ? (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        placeholder="Enter code"
                                        className="flex-1 text-black px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base"
                                    />
                                    <button
                                        onClick={applyPromoCode}
                                        disabled={!promoCode.trim()}
                                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-950 disabled:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
                                    >
                                        Apply
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-green-800 font-medium text-xs sm:text-sm truncate">&quot;{promoCode}&quot; applied</span>
                                    </div>
                                    <button
                                        onClick={removePromo}
                                        className="text-green-600 hover:text-green-800 font-medium text-xs sm:text-sm shrink-0"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6 sticky top-16 sm:top-20">
                            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-4 sm:mb-5 lg:mb-6">Order Summary</h3>

                            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-gray-600">Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-gray-600">Tax (8.75%)</span>
                                    <span className="font-medium">${tax.toFixed(2)}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600 text-sm sm:text-base">
                                        <span>Promo Discount</span>
                                        <span className="font-medium">-${discount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                                    <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <Link href="/checkout" className="block">
                                <button className="w-full bg-gray-900 text-white py-3 sm:py-3.5 lg:py-4 rounded-lg font-semibold hover:bg-gray-800 active:bg-gray-950 transition-colors text-sm sm:text-base">
                                    Proceed to Checkout
                                </button>
                            </Link>

                            {/* Trust badges */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-center gap-4 text-gray-400">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                    </svg>
                                </div>
                                <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-2">Secure checkout • Free returns • Fast shipping</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Scrollbar hide styles */}
            <style jsx global>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default CartPage;