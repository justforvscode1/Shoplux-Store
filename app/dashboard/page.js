"use client"
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CompletedOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [returnModal, setReturnModal] = useState({ show: false, orderId: null });
    const [returnReason, setReturnReason] = useState('');
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
    const { data, status } = useSession();
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (status === 'authenticated') {
            (async () => {
                try {
                    const orders = await fetch(`/api/order/${data.user.id}`);
                    const response = await orders.json();
                    setOrders(response);
                } catch (error) {
                    console.error('Error fetching completed orders:', error);
                    setOrders([]);
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [status, data]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowFilterDropdown(false);
            }
        };

        if (showFilterDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showFilterDropdown]);

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const toggleFilterDropdown = () => {
        setShowFilterDropdown(!showFilterDropdown);
    };

    const handleFilterSelect = (filter) => {
        setStatusFilter(filter);
        setShowFilterDropdown(false);
    };

    const handleReturnOrder = async (e) => {
        e.preventDefault();
        if (!returnReason.trim()) return;

        setIsSubmittingReturn(true);
        try {
            const response = await fetch(`/api/order/${data.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: returnModal.orderId,
                    status: 'returned',
                    returnReason: returnReason
                })
            });

            if (!response.ok) throw new Error('Failed to submit return request');

            const updatedOrder = await response.json();

            // Update local state
            setOrders(orders.map(order =>
                order.orderId === returnModal.orderId
                    ? { ...order, status: 'returned' }
                    : order
            ));

            setReturnModal({ show: false, orderId: null });
            setReturnReason('');
            // Optional: Show success toast/message
        } catch (error) {
            console.error('Error returning order:', error);
            alert('Failed to submit return request. Please try again.');
        } finally {
            setIsSubmittingReturn(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatShippingAddress = (shippingForm) => {
        return `${shippingForm.address}${shippingForm.apartment ? ', ' + shippingForm.apartment : ''}, ${shippingForm.city}, ${shippingForm.state} ${shippingForm.zipCode}`;
    };

    const getStatusBadge = (status) => {
        const styles = {
            delivered: 'bg-green-100 text-green-800 border border-green-200',
            cancelled: 'bg-red-100 text-red-800 border border-red-200',
            returned: 'bg-amber-100 text-amber-800 border border-amber-200',
            pending: 'bg-amber-100 text-amber-800 border border-amber-200'
        };
        return styles[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border border-gray-200';
    };

    const getFilterLabel = (filter) => {
        const labels = {
            all: 'All Orders',
            pending: 'Pending',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
            returned: 'Returned'
        };
        return labels[filter] || 'All Orders';
    };

    const filteredOrders = orders
        .filter(order => {
            if (statusFilter === 'all') return true;
            return order.status.toLowerCase() === statusFilter;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first

    const deliveredOrders = orders.filter(order => order.status.toLowerCase() === 'delivered');
    const cancelledOrders = orders.filter(order => order.status.toLowerCase() === 'cancelled');
    const pendingOrders = orders.filter(order => order.status.toLowerCase() === 'pending');
    const returnedOrders = orders.filter(order => order.status.toLowerCase() === 'returned');

    const getFilteredStats = () => {
        switch (statusFilter) {
            case 'pending':
                return {
                    totalOrders: pendingOrders.length,
                    totalValue: pendingOrders.reduce((sum, order) => sum + order.total, 0),
                    averageOrder: pendingOrders.length ? (pendingOrders.reduce((sum, order) => sum + order.total, 0) / pendingOrders.length).toFixed(2) : 0,
                    totalItems: pendingOrders.reduce((sum, order) => sum + order.orderedItems.length, 0)
                };
            case 'delivered':
                return {
                    totalOrders: deliveredOrders.length,
                    totalValue: deliveredOrders.reduce((sum, order) => sum + order.total, 0),
                    averageOrder: deliveredOrders.length ? (deliveredOrders.reduce((sum, order) => sum + order.total, 0) / deliveredOrders.length).toFixed(2) : 0,
                    totalItems: deliveredOrders.reduce((sum, order) => sum + order.orderedItems.length, 0)
                };
            case 'cancelled':
                return {
                    totalOrders: cancelledOrders.length,
                    totalValue: cancelledOrders.reduce((sum, order) => sum + order.total, 0),
                    averageOrder: cancelledOrders.length ? (cancelledOrders.reduce((sum, order) => sum + order.total, 0) / cancelledOrders.length).toFixed(2) : 0,
                    totalItems: cancelledOrders.reduce((sum, order) => sum + order.orderedItems.length, 0)
                };
            case 'returned':
                return {
                    totalOrders: returnedOrders.length,
                    totalValue: returnedOrders.reduce((sum, order) => sum + order.total, 0),
                    averageOrder: returnedOrders.length ? (returnedOrders.reduce((sum, order) => sum + order.total, 0) / returnedOrders.length).toFixed(2) : 0,
                    totalItems: returnedOrders.reduce((sum, order) => sum + order.orderedItems.length, 0)
                };
            default:
                return {
                    totalOrders: orders.length,
                    totalValue: orders.reduce((sum, order) => sum + order.total, 0),
                    averageOrder: orders.length ? (orders.reduce((sum, order) => sum + order.total, 0) / orders.length).toFixed(2) : 0,
                    totalItems: orders.reduce((sum, order) => sum + order.orderedItems.length, 0)
                };
        }
    };

    const stats = getFilteredStats();

    if (loading) {
        return <LoadingScreen message="Loading your orders..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-6 sm:mb-8 lg:mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 tracking-tight">
                                Your Orders
                                <span className="block w-12 sm:w-16 lg:w-20 h-1 bg-blue-600 mt-2 sm:mt-3 rounded-full"></span>
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">Track and manage all your purchases</p>
                        </div>
                        <Link
                            href="/track"
                            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all font-medium shadow-md shadow-blue-100 group"
                        >
                            <span className="mr-2">Track Order</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                </div>

                {/* Filter Section */}
                <div className="mb-6 sm:mb-8 lg:mb-10">
                    {/* Mobile Filter Dropdown */}
                    <div className="md:hidden relative" ref={dropdownRef}>
                        <button
                            onClick={toggleFilterDropdown}
                            className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg shadow-sm active:bg-gray-50 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span className="text-sm sm:text-base text-gray-700 font-medium">{getFilterLabel(statusFilter)}</span>
                                <span className="text-xs px-1.5 sm:px-2 py-0.5 bg-blue-600 text-white rounded-full">
                                    {filteredOrders.length}
                                </span>
                            </div>
                            <svg
                                className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transform transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showFilterDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                {[
                                    { key: 'all', label: 'All Orders', count: orders.length },
                                    { key: 'pending', label: 'Pending', count: pendingOrders.length },
                                    { key: 'delivered', label: 'Delivered', count: deliveredOrders.length },
                                    { key: 'cancelled', label: 'Cancelled', count: cancelledOrders.length },
                                    { key: 'returned', label: 'Returned', count: returnedOrders.length }
                                ].map((tab, index) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleFilterSelect(tab.key)}
                                        className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-colors ${statusFilter === tab.key
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                                            } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                                    >
                                        <span className="text-sm sm:text-base font-medium">{tab.label}</span>
                                        <span
                                            className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${statusFilter === tab.key
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop Filter Tabs */}
                    <div className="hidden md:flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
                        {[
                            { key: 'all', label: 'All Orders', count: orders.length },
                            { key: 'pending', label: 'Pending', count: pendingOrders.length },
                            { key: 'delivered', label: 'Delivered', count: deliveredOrders.length },
                            { key: 'cancelled', label: 'Cancelled', count: cancelledOrders.length },
                            { key: 'returned', label: 'Returned', count: returnedOrders.length }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${statusFilter === tab.key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                                    }`}
                            >
                                {tab.label}
                                <span className={`ml-1.5 lg:ml-2 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab.key
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8 lg:mb-10">
                    {[
                        { label: 'Total Orders', value: stats.totalOrders, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                        { label: 'Total Items', value: stats.totalItems, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10' },
                        { label: 'Total Value', value: `$${stats.totalValue.toFixed(2)}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { label: 'Avg Order', value: `$${stats.averageOrder}`, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
                    ].map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-200"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2 truncate">{stat.label}</p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                                </div>
                                <div className="p-1.5 sm:p-2 lg:p-3 bg-blue-50 rounded-lg shrink-0 ml-2">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={stat.icon} />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Orders List */}
                <div className="space-y-3 sm:space-y-4">
                    {filteredOrders.map((order) => (
                        <div
                            key={order.orderId}
                            className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Order Header */}
                            <div
                                className="p-3 sm:p-4 lg:p-5 cursor-pointer hover:bg-blue-50/50 transition-colors border-l-4 border-blue-600"
                                onClick={() => toggleOrderExpansion(order.orderId)}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
                                                #{order.orderId.substring(0, 8).toUpperCase()}
                                            </h3>
                                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusBadge(order.status)} uppercase`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate">{formatDate(order.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Total:</span>
                                                <span className="font-bold text-gray-900">${order.total?.toFixed(2)}</span>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-1 text-gray-600">
                                                <span>Items: {order.orderedItems?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <svg
                                            className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-600 transform transition-transform duration-200 ${expandedOrder === order.orderId ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Order Details */}
                            {expandedOrder === order.orderId && (
                                <div className="px-3 sm:px-4 lg:px-5 pb-4 sm:pb-5 lg:pb-6 border-t border-gray-200">
                                    {/* Order Items */}
                                    <div className="mt-4 sm:mt-5">
                                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 sm:mb-4 flex items-center gap-2">
                                            <span>Order Items ({order.orderedItems?.length || 0})</span>
                                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse"></span>
                                        </h4>
                                        <div className="space-y-2 sm:space-y-3">
                                            {order.orderedItems?.map((item) => (
                                                <div key={item._id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <Link href={`/product/${item.productId}`} className="shrink-0">
                                                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                            <Image src={item.image} alt={item.name} width={60} height={60} className="w-full h-full object-contain" unoptimized={item.image?.startsWith('/uploads')} />
                                                        </div>
                                                    </Link>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{item.name}</h5>
                                                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">{item.brand} • Qty: {item.quantity}</p>
                                                        <div className="flex items-center gap-0.5 mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <svg
                                                                    key={i}
                                                                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < Math.floor(item.rating || 0) ? 'text-amber-400' : 'text-gray-300'}`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm sm:text-base font-bold text-gray-900">${item.price?.toFixed(2)}</p>
                                                        <p className="text-[10px] sm:text-xs text-gray-500">
                                                            Total: ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                                        </p>
                                                        {order.status.toLowerCase() === 'delivered' && (
                                                            <Link
                                                                href={`/review-order/${item.productId}`}
                                                                className="inline-block mt-1.5 sm:mt-2 px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] sm:text-xs font-medium hover:bg-blue-100 transition-colors"
                                                            >
                                                                Write Review
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        {[
                                            { label: 'Subtotal', value: `$${order.subtotal?.toFixed(2)}` },
                                            { label: 'Tax', value: `$${order.tax?.toFixed(2)}` },
                                            { label: 'Shipping', value: order.shippingCost === 0 ? 'Free' : `$${order.shippingCost}` },
                                            { label: 'Total', value: `$${order.total?.toFixed(2)}`, highlight: true }
                                        ].map((item, idx) => (
                                            <div key={idx} className="text-center">
                                                <p className="text-[10px] sm:text-xs text-blue-600 uppercase font-semibold mb-0.5 sm:mb-1">{item.label}</p>
                                                <p className={`text-sm sm:text-base lg:text-lg font-bold ${item.highlight ? 'text-blue-600' : 'text-gray-900'}`}>{item.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Customer & Shipping Info */}
                                    <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase mb-2 sm:mb-3">Customer</h4>
                                            <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg border border-gray-200 text-xs sm:text-sm space-y-1">
                                                <p><span className="text-gray-500">Name:</span> <span className="text-gray-900">{order.shippingForm?.firstName} {order.shippingForm?.lastName}</span></p>
                                                <p className="truncate"><span className="text-gray-500">Email:</span> <span className="text-gray-900">{order.shippingForm?.email}</span></p>
                                                <p><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{order.shippingForm?.phone}</span></p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase mb-2 sm:mb-3">Shipping Address</h4>
                                            <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg border border-gray-200 text-xs sm:text-sm">
                                                <p className="text-gray-700 leading-relaxed">{formatShippingAddress(order.shippingForm)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-4 sm:mt-5 flex flex-wrap gap-2">
                                        {order.status.toLowerCase() === 'delivered' && (
                                            <button
                                                onClick={() => setReturnModal({ show: true, orderId: order.orderId })}
                                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-xs sm:text-sm font-medium border border-gray-300"
                                            >
                                                Return Items
                                            </button>
                                        )}
                                        <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-xs sm:text-sm font-medium border border-gray-300">
                                            Download Invoice
                                        </button>
                                        <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-xs sm:text-sm font-medium border border-gray-300">
                                            Need Help?
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredOrders.length === 0 && !loading && (
                    <div className="text-center py-10 sm:py-12 lg:py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                            </svg>
                        </div>
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                            {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
                        </h3>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                            {statusFilter === 'all' ? "Start your shopping journey with us today" : `You don't have any ${statusFilter} orders at the moment`}
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium"
                        >
                            Start Shopping
                        </Link>
                    </div>
                )}
            </main>

            <Footer />

            {/* Return Modal */}
            {returnModal.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Return Order</h3>
                            <p className="text-gray-600 text-sm">
                                Please let us know why you&apos;d like to return this order.
                            </p>
                        </div>

                        <form onSubmit={handleReturnOrder}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Return
                                </label>
                                <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none h-32 text-sm"
                                    placeholder="Product was damaged, wrong size, etc..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReturnModal({ show: false, orderId: null });
                                        setReturnReason('');
                                    }}
                                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReturn || !returnReason.trim()}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm flex items-center justify-center gap-2"
                                >
                                    {isSubmittingReturn ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}