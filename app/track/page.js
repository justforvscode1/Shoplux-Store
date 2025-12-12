"use client"
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import LoadingScreen from '@/components/LoadingScreen';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Helper functions extracted for performance
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatPrice = (priceInCents) => {
  return priceInCents.toFixed(2);
};

const formatShippingAddress = (shippingForm) => {
  return `${shippingForm.address}${shippingForm.apartment ? ', ' + shippingForm.apartment : ''}, ${shippingForm.city}, ${shippingForm.state} ${shippingForm.zipCode}`;
};

const getStatusBadge = (status) => {
  const badges = {
    pending: {
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      label: 'Order Placed'
    },
    assigned: {
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      label: 'Being Prepared'
    },
    out_for_delivery: {
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      label: 'Out for Delivery'
    },
    delivered: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      label: 'Delivered'
    },
    cancelled: {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
      label: 'Cancelled'
    }
  };
  return badges[status] || badges.pending;
};

const getPriorityBadge = (priority) => {
  if (priority === 'high') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        High Priority
      </span>
    );
  }
  return null;
};

const canCancelOrder = (status) => {
  return ['pending', 'assigned'].includes(status);
};

const getOrderStatusProgress = (status, createdAt, assignedAt, pickedAt, deliveredAt, cancelledAt) => {
  const steps = [
    { key: 'placed', label: 'Order Placed', date: createdAt, active: true },
    { key: 'assigned', label: 'Being Prepared', date: assignedAt, active: ['assigned', 'out_for_delivery', 'delivered'].includes(status) },
    { key: 'out_for_delivery', label: 'Out for Delivery', date: pickedAt, active: ['out_for_delivery', 'delivered'].includes(status) },
    { key: 'delivered', label: 'Delivered', date: deliveredAt, active: status === 'delivered' }
  ];

  if (status === 'cancelled') {
    return [
      { key: 'placed', label: 'Order Placed', date: createdAt, active: true },
      { key: 'cancelled', label: 'Order Cancelled', date: cancelledAt, active: true, cancelled: true }
    ];
  }

  return steps;
};

export default function UserOrdersDashboard() {
  const { data, status } = useSession()
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null });

  useEffect(() => {
    if (status === "authenticated") {
      const fetchUserOrders = async () => {
        try {
          const getthedata = await fetch(`/api/order/${data.user.id}`, { cache: 'no-store' })
          const apidata = await getthedata.json()
          setOrders(apidata);
        } catch (error) {
          console.error('Error fetching user orders:', error);
        } finally {
          setLoading(false);
        };
      }
      fetchUserOrders()
    }
  }, [status, data?.user?.id]);

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/order/${data.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId, status: 'cancelled' })
      });

      const datas = await response.json();

      if (!response.ok) throw new Error(datas.error || 'Failed to cancel order');

      if (datas.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.orderId === orderId
              ? { ...order, status: 'cancelled', cancelledAt: new Date().toISOString() }
              : order
          )
        );
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order: ' + error.message);
    }
    setCancelModal({ show: false, orderId: null });
  };

  const openCancelModal = (orderId) => {
    setCancelModal({ show: true, orderId });
  };

  if (loading) {
    return <LoadingScreen message="Loading orders..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Track Orders</h1>
          <p className="text-gray-600">Track and manage your recent orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar - Order Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:sticky lg:top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Active</span>
                  <div className="text-2xl font-bold text-blue-700 mt-1">
                    {orders.filter(o => ['pending', 'assigned', 'out_for_delivery'].includes(o.status)).length}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg">
                  <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Delivered</span>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">
                    {orders.filter(o => o.status === 'delivered').length}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</span>
                  <div className="text-2xl font-bold text-gray-700 mt-1">
                    {orders.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Status Filter */}
            <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                {[
                  { key: 'all', label: 'All', count: orders.length },
                  { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
                  { key: 'assigned', label: 'Preparing', count: orders.filter(o => o.status === 'assigned').length },
                  { key: 'out_for_delivery', label: 'In Transit', count: orders.filter(o => o.status === 'out_for_delivery').length },
                  { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
                  { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${statusFilter === filter.key
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {filter.label} <span className="ml-1 opacity-75">({filter.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const statusBadge = getStatusBadge(order.status);
                const priorityBadge = getPriorityBadge(order.priority);
                const progressSteps = getOrderStatusProgress(order.status, order.createdAt, order.assignedAt, order.pickedAt, order.deliveredAt, order.cancelledAt);

                return (
                  <div
                    key={order.orderId}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                  >
                    {/* Order Header */}
                    <div className="p-5 sm:p-6 border-b border-gray-50">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-gray-900">
                              #{order.orderId?.substring(0, 8).toUpperCase() || 'N/A'}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.bgColor} ${statusBadge.textColor} ${statusBadge.borderColor}`}>
                              {statusBadge.label}
                            </span>
                            {priorityBadge}
                          </div>

                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              {order.orderedItems.length} items
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-gray-900">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ${formatPrice(order.total)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canCancelOrder(order.status) && (
                            <button
                              onClick={() => openCancelModal(order.orderId)}
                              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => toggleOrderExpansion(order.orderId)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            {expandedOrder === order.orderId ? 'Hide Details' : 'View Details'}
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${expandedOrder === order.orderId ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Responsive Progress Bar */}
                      <div className="relative py-4">
                        {/* Desktop Line */}
                        <div className="hidden md:block absolute top-[1.65rem] left-0 right-0 h-0.5 bg-gray-100 w-full" />
                        {/* Mobile Line */}
                        <div className="md:hidden absolute left-[1.1rem] top-4 bottom-4 w-0.5 bg-gray-100" />

                        <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-0">
                          {progressSteps.map((step) => (
                            <div key={step.key} className="flex md:flex-col items-center md:flex-1 relative z-10 gap-4 md:gap-2">
                              {/* Indicator Dot */}
                              <div className={`w-9 h-9 flex items-center justify-center rounded-full border-2 bg-white transition-colors duration-300 shrink-0
                                ${step.active
                                  ? step.cancelled
                                    ? 'border-red-500 text-red-500'
                                    : 'border-blue-600 text-blue-600'
                                  : 'border-gray-200 text-gray-300'
                                }`}
                              >
                                {step.active ? (
                                  step.cancelled ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full bg-current" />
                                )}
                              </div>

                              {/* Label */}
                              <div className="md:text-center pt-1 md:pt-0">
                                <p className={`text-sm font-medium ${step.active ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {step.label}
                                </p>
                                {step.date && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {formatDate(step.date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <div className={`overflow-hidden transition-all duration-300 bg-gray-50/50 ${expandedOrder === order.orderId ? 'max-h-[2000px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'}`}>
                      <div className="p-5 sm:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Order Items */}
                          <div className="lg:col-span-2 space-y-4">
                            <h4 className="font-semibold text-gray-900">Items Ordered</h4>
                            <div className="space-y-3">
                              {order.orderedItems.map((item) => (
                                <div key={item._id} className="flex gap-4 p-3 bg-white rounded-lg border border-gray-100">
                                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      width={80}
                                      height={80}
                                      className="object-cover w-full h-full"
                                      unoptimized={item.image?.startsWith('/uploads')}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                      <h5 className="font-medium text-gray-900 truncate">{item.name}</h5>
                                      {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                      <p className="font-medium text-gray-900">${formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Info */}
                          <div className="space-y-6">
                            <div className="bg-white p-4 rounded-lg border border-gray-100">
                              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Delivery Details</h4>
                              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                {formatShippingAddress(order.shippingForm)}
                              </p>
                              {order.estimatedDelivery && (
                                <div className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-md">
                                  Estimated Delivery: <span className="font-medium">{formatDate(order.estimatedDelivery)}</span>
                                </div>
                              )}
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-100">
                              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Payment Summary</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                  <span>Subtotal</span>
                                  <span>${formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                  <span>Tax</span>
                                  <span>${formatPrice(order.tax)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                  <span>Shipping</span>
                                  <span>${formatPrice(order.shippingCost)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                                  <span>Total</span>
                                  <span>${formatPrice(order.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredOrders.length === 0 && !loading && (
              <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No Orders Found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {statusFilter === 'all' ? "You haven't placed any orders yet." : `No ${statusFilter} orders found.`}
                </p>
                <Link href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Order?</h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal({ show: false, orderId: null })}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(cancelModal.orderId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm shadow-sm"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}