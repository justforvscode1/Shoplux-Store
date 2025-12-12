"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '@/components/paymentForm';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const generateOrderId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 11);
    return `ORD-${timestamp}-${random}`.toUpperCase();
};

const CheckoutPage = () => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [pendingOrderId, setPendingOrderId] = useState(null);
    const [shippingMethod, setShippingMethod] = useState('standard');
    const { data, status } = useSession()
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [newsletterSubscribe, setNewsletterSubscribe] = useState(false);
    const [orderItems, setorderitems] = useState([])
    const [errorhandle, seterrorhandle] = useState(false)
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const router = useRouter()
    const [shippingForm, setShippingForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
    });

    useEffect(() => {
        if (status === "authenticated" && data) {
            const getcartitems = async () => {
                const response = await fetch(`/api/cart/${data.user.id}`)
                const cartData = await response.json()
                const cleanedItems = cartData.map(({ userId, stockCount, ...item }) => item)
                setorderitems(cleanedItems)
            }
            getcartitems()
        }
    }, [status, data])

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = shippingMethod === 'express' ? 24.99 : shippingMethod === 'overnight' ? 49.99 : 0;
    const tax = subtotal * 0.0875;
    const total = subtotal + shippingCost + tax;

    const handleShippingChange = (field, value) => {
        setShippingForm(prev => ({ ...prev, [field]: value }));
    };

    const handleback = () => {
        router.back()
    }



    const createOrderInDatabase = async (orderId, paymentStatus) => {
        const orderedItems = orderItems.map(({ _id, ...item }) => item)
        const finaldata = {
            orderId,
            orderedItems: orderedItems,
            paymentMethod,
            paymentStatus,
            status: 'pending',
            shippingForm,
            shippingMethod,
            shippingCost,
            subtotal,
            tax,
            total,
        };

        try {
            const sendcheckout = await fetch(`/api/order/${data.user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finaldata),
            });
            const response = await sendcheckout.json();

            if (!sendcheckout.ok) {
                return { ok: false, error: response?.error || 'Failed to create order' };
            }

            const check = await fetch(`/api/cart/${data.user.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.user.id }),
            });

            if (!check.ok) {
                const responses = await check.json();
                return { ok: false, error: responses?.error || 'Order created but failed to clear cart' };
            }

            return { ok: true, data: response };
        } catch (err) {
            console.error('createOrderInDatabase error', err);
            return { ok: false, error: err?.message || String(err) };
        }
    };

    const handlePlaceOrder = async () => {
        try {
            const isEmptyField = Object.entries(shippingForm).some(([key, value]) =>
                key !== 'apartment' && value.trim() === ''
            );

            if (isEmptyField) {
                seterrorhandle(true)
                return false;
            }

            seterrorhandle(false)
            setAgreedToTerms(false)

            if (paymentMethod === 'cod') {
                const orderId = generateOrderId();
                await createOrderInDatabase(orderId, 'pending');
                toast.success('Order placed successfully!', { position: 'top-center' });
                setTimeout(() => {
                    router.replace('/dashboard');
                }, 1000);
                return false;
            }

            if (paymentMethod === 'card') {
                const orderId = generateOrderId();
                setPendingOrderId(orderId);
                setIsProcessingPayment(true);
                return orderId;
            }

            return false;
        } catch (error) {
            console.error(error)
            toast.error("Error placing order", { position: "top-center" })
            setIsProcessingPayment(false);
            return false;
        }
    };

    const handleStripePaymentSuccess = async (paymentIntentId, orderIdFromForm) => {
        try {
            const orderId = orderIdFromForm || pendingOrderId || generateOrderId();
            const result = await createOrderInDatabase(orderId, 'paid');
            if (result.ok) {
                toast.success('Order placed successfully!', { position: 'top-center' });
                setPendingOrderId(null);
                setIsProcessingPayment(false);
                router.replace('/dashboard');
            } else {
                toast.error(result.error || 'Order creation failed', { position: 'top-center' });
                setIsProcessingPayment(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error completing order', { position: 'top-center' });
            setIsProcessingPayment(false);
        }
    };

    const handleStripePaymentError = (errorMessage) => {
        toast.error(errorMessage, { position: "top-center" });
        setIsProcessingPayment(false);
    };

    return (
        <div className="min-h-screen text-black bg-gray-50 flex flex-col">
            <Navbar />

            <main className="grow container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
                {/* Header with back button */}
                <div className="mb-6 flex items-center justify-between">
                    <button onClick={handleback} className="text-gray-600 flex items-center hover:text-gray-900 active:text-gray-950 transition-colors">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm sm:text-base lg:text-lg font-semibold ml-1">Back</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="hidden sm:inline">Secure Checkout</span>
                        <span className="sm:hidden">Secure</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                        {/* Shipping Information */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6">
                            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold mr-2 sm:mr-3">
                                    1
                                </div>
                                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Shipping Information</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">First Name *</label>
                                    <input
                                        type="text"
                                        value={shippingForm.firstName}
                                        onChange={(e) => handleShippingChange('firstName', e.target.value)}
                                        className="w-full px-3 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Last Name *</label>
                                    <input
                                        type="text"
                                        value={shippingForm.lastName}
                                        onChange={(e) => handleShippingChange('lastName', e.target.value)}
                                        className="w-full px-3 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Email *</label>
                                    <input
                                        type="email"
                                        value={shippingForm.email}
                                        onChange={(e) => handleShippingChange('email', e.target.value)}
                                        className="w-full px-3 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Phone *</label>
                                    <input
                                        type="tel"
                                        value={shippingForm.phone}
                                        onChange={(e) => handleShippingChange('phone', e.target.value)}
                                        className="w-full px-3 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-3 sm:mb-4">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Street Address *</label>
                                <input
                                    type="text"
                                    value={shippingForm.address}
                                    onChange={(e) => handleShippingChange('address', e.target.value)}
                                    className="w-full px-3 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base"
                                    required
                                />
                            </div>

                            <div className="mb-3 sm:mb-4">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Apartment (Optional)</label>
                                <input
                                    type="text"
                                    value={shippingForm.apartment}
                                    onChange={(e) => handleShippingChange('apartment', e.target.value)}
                                    className="w-full px-3 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">City *</label>
                                    <input
                                        type="text"
                                        value={shippingForm.city}
                                        onChange={(e) => handleShippingChange('city', e.target.value)}
                                        className="w-full px-2 sm:px-3 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">State *</label>
                                    <select
                                        value={shippingForm.state}
                                        onChange={(e) => handleShippingChange('state', e.target.value)}
                                        className="w-full px-2 sm:px-3 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base bg-white"
                                        required
                                    >
                                        <option value="">Select</option>
                                        <option value="CA">CA</option>
                                        <option value="NY">NY</option>
                                        <option value="TX">TX</option>
                                        <option value="FL">FL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">ZIP *</label>
                                    <input
                                        type="text"
                                        value={shippingForm.zipCode}
                                        onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                                        className="w-full px-2 sm:px-3 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm sm:text-base"
                                        required
                                    />
                                </div>
                            </div>

                            {errorhandle && (
                                <div className="text-center text-red-500 text-xs sm:text-sm mt-3 sm:mt-4 bg-red-50 py-2 rounded-lg">
                                    Please fill all required fields
                                </div>
                            )}
                        </div>

                        {/* Shipping Method */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6">
                            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold mr-2 sm:mr-3">
                                    2
                                </div>
                                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Shipping Method</h2>
                            </div>

                            <div className="space-y-2 sm:space-y-3">
                                {[
                                    { id: 'standard', name: 'Standard', time: '5-7 days', price: 'FREE', priceValue: 0 },
                                    { id: 'express', name: 'Express', time: '2-3 days', price: '$24.99', priceValue: 24.99 },
                                    { id: 'overnight', name: 'Overnight', time: '1 day', price: '$49.99', priceValue: 49.99 },
                                ].map((method) => (
                                    <div
                                        key={method.id}
                                        className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-colors active:bg-gray-100 ${shippingMethod === method.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
                                        onClick={() => setShippingMethod(method.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={shippingMethod === method.id}
                                                    onChange={() => setShippingMethod(method.id)}
                                                    className="mr-2 sm:mr-3 w-4 h-4"
                                                />
                                                <div>
                                                    <p className="text-sm sm:text-base font-semibold text-gray-900">{method.name}</p>
                                                    <p className="text-xs sm:text-sm text-gray-500">{method.time}</p>
                                                </div>
                                            </div>
                                            <span className={`text-sm sm:text-base font-semibold ${method.priceValue === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                {method.price}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6">
                            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold mr-2 sm:mr-3">
                                    3
                                </div>
                                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Payment</h2>
                            </div>

                            <div className="space-y-2 sm:space-y-3">
                                <div
                                    className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-colors active:bg-gray-100 ${paymentMethod === 'card' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
                                    onClick={() => setPaymentMethod('card')}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'card'}
                                            onChange={() => setPaymentMethod('card')}
                                            className="mr-2 sm:mr-3 w-4 h-4"
                                        />
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        <span className="text-sm sm:text-base font-semibold text-gray-900">Credit/Debit Card</span>
                                    </div>
                                </div>

                                <div
                                    className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-colors active:bg-gray-100 ${paymentMethod === 'cod' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
                                    onClick={() => setPaymentMethod('cod')}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => setPaymentMethod('cod')}
                                            className="mr-2 sm:mr-3 w-4 h-4"
                                        />
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="text-sm sm:text-base font-semibold text-gray-900">Cash on Delivery</span>
                                    </div>
                                </div>
                            </div>

                            {paymentMethod === 'cod' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-yellow-800">Cash on Delivery</p>
                                            <p className="text-[10px] sm:text-xs text-yellow-700">Have exact cash ready upon delivery</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-2 lg:sticky lg:top-20 h-fit">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6">
                            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-4 sm:mb-5 lg:mb-6">Order Summary</h3>

                            {/* Order Items */}
                            <div className="space-y-3 mb-4 sm:mb-6 max-h-48 sm:max-h-60 overflow-y-auto">
                                {orderItems.map((item) => {
                                    const productSlug = item.name?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                    return (
                                        <div key={item._id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-b-0">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                                <Image src={item.image || '/uploads/products/' + productSlug + '.png'} alt={item.name} width={50} height={50} unoptimized />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] sm:text-xs text-gray-500">{item.brand}</p>
                                                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                                                <p className="text-[10px] sm:text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm sm:text-base font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Order Totals */}
                            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : ''}`}>
                                        {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="font-medium">${tax.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-2 sm:pt-3">
                                    <div className="flex justify-between text-base sm:text-lg font-bold">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="space-y-3 mb-4 sm:mb-5">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="mt-0.5 w-4 h-4"
                                        required
                                    />
                                    <span className="text-xs sm:text-sm text-gray-700">
                                        I agree to the <a href="#" className="text-blue-600 hover:underline">Terms</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> *
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newsletterSubscribe}
                                        onChange={(e) => setNewsletterSubscribe(e.target.checked)}
                                        className="mt-0.5 w-4 h-4"
                                    />
                                    <span className="text-xs sm:text-sm text-gray-700">
                                        Subscribe to newsletter
                                    </span>
                                </label>
                            </div>

                            {/* Place Order Button */}
                            {paymentMethod === 'card' ? (
                                <Elements stripe={stripePromise}>
                                    <PaymentForm
                                        orderId={pendingOrderId}
                                        amount={total}
                                        email={shippingForm.email}
                                        onSuccess={handleStripePaymentSuccess}
                                        onError={handleStripePaymentError}
                                        isProcessing={isProcessingPayment}
                                        agreedToTerms={agreedToTerms}
                                        handlePlaceOrder={handlePlaceOrder}
                                        createOrderInDatabase={createOrderInDatabase}
                                    />
                                </Elements>
                            ) : (
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={!agreedToTerms || isProcessingPayment}
                                    className="w-full bg-gray-900 text-white py-3 sm:py-3.5 lg:py-4 rounded-lg font-semibold hover:bg-gray-800 active:bg-gray-950 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                                >
                                    {isProcessingPayment ? 'Processing...' : 'Place Order (COD)'}
                                </button>
                            )}

                            {/* Security Info */}
                            <div className="text-center mt-4 sm:mt-5">
                                <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-1">
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>256-bit SSL encryption</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400">
                                    Your payment info is secure
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutPage;