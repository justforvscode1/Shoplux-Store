"use client"
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function ShipperDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'assigned', 'out_for_delivery', 'delivered'
  const [deliveryModal, setDeliveryModal] = useState({ show: false, orderId: null, action: null });
  const [shipperInfo] = useState({
    name: 'Alex Rodriguez',
    id: 'SP001',
    vehicle: 'Van - ABC 123',
    zone: 'North District'
  });

  const fetchOrders = async () => {
    const getthedata = await fetch("/api/order")
    const mockOrders = await getthedata.json()
    return mockOrders;
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        // Replace this with actual API call: const response = await fetch("/api/order")
        const mockData = await fetchOrders();
        setOrders(mockData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (priceInCents) => {
    return (priceInCents / 100).toFixed(2);
  };

  const formatShippingAddress = (shippingForm) => {
    return `${shippingForm.address}${shippingForm.apartment ? ', ' + shippingForm.apartment : ''}, ${shippingForm.city}, ${shippingForm.state} ${shippingForm.zipCode}`;
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Pending Assignment'
      },
      assigned: {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Assigned'
      },
      out_for_delivery: {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L16 7.586A1 1 0 0015.414 7H14z" />
          </svg>
        ),
        label: 'Out for Delivery'
      },
      delivered: {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Delivered'
      }
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
          High Priority
        </span>
      );
    }
    return null;
  };

  const handleStatusUpdate = async (orderId, newStatus, additionalData = {}) => {
    // In real app, make API call here
    // await fetch(`/api/order/${orderId}/status`, { 
    //   method: 'PATCH', 
    //   body: JSON.stringify({ status: newStatus, ...additionalData })
    // });
    // Frontend API call
    await fetch(`/api/order`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, orderId })
    });

    // Backend database operation

    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.orderId === orderId
          ? {
            ...order,
            status: newStatus,
            ...additionalData,
            ...(newStatus === 'assigned' && { assignedat: new Date().toISOString() }),
            ...(newStatus === 'out_for_delivery' && { pickedat: new Date().toISOString() }),
            ...(newStatus === 'delivered' && { deliveredat: new Date().toISOString() })
          }
          : order
      )
    );
    setDeliveryModal({ show: false, orderId: null, action: null });
  };

  const openDeliveryModal = (orderId, action) => {
    setDeliveryModal({ show: true, orderId, action });
  };

  const getActionButtons = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <button
            onClick={() => openDeliveryModal(order.orderId, 'assign')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Accept Order
          </button>
        );
      case 'assigned':
        return (
          <button
            onClick={() => openDeliveryModal(order.orderId, 'pickup')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transform transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H15a2 2 0 012 2v2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V10m-9 4h4" />
            </svg>
            Mark as Picked Up
          </button>
        );
      case 'out_for_delivery':
        return (
          <button
            onClick={() => openDeliveryModal(order.orderId, 'deliver')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transform transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Mark as Delivered
          </button>
        );
      default:
        return null;
    }
  };

  const getModalContent = (action) => {
    const content = {
      assign: {
        title: 'Accept Order',
        message: 'Accept this order for pickup and delivery?',
        color: 'blue',
        icon: (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        buttonText: 'Accept Order',
        newStatus: 'assigned'
      },
      pickup: {
        title: 'Confirm Pickup',
        message: 'Mark this order as picked up and ready for delivery?',
        color: 'orange',
        icon: (
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H15a2 2 0 012 2v2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V10m-9 4h4" />
          </svg>
        ),
        buttonText: 'Confirm Pickup',
        newStatus: 'out_for_delivery'
      },
      deliver: {
        title: 'Confirm Delivery',
        message: 'Mark this order as successfully delivered to the customer?',
        color: 'green',
        icon: (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ),
        buttonText: 'Confirm Delivery',
        newStatus: 'delivered'
      }
    };
    return content[action] || content.assign;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-3">
              <div className="h-8 bg-gray-200 rounded mb-6 animate-pulse"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-6 mb-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar - Shipper Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6 transform transition-all duration-300 hover:shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{shipperInfo.name}</h3>
                  <p className="text-sm text-gray-600">ID: {shipperInfo.id}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Vehicle: {shipperInfo.vehicle}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Zone: {shipperInfo.zone}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Summary</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-semibold text-gray-600">{orders.filter(o => o.status === 'pending').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Assigned</span>
                  <span className="font-semibold text-blue-600">{orders.filter(o => o.status === 'assigned').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Out for Delivery</span>
                  <span className="font-semibold text-yellow-600">{orders.filter(o => o.status === 'out_for_delivery').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivered</span>
                  <span className="font-semibold text-green-600">{orders.filter(o => o.status === 'delivered').length}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-gray-900">Total Orders</span>
                    <span className="text-gray-900">{orders.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Delivery Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your assigned deliveries</p>
            </div>

            {/* Status Filter */}
            <div className="mb-4 sm:mb-6 -mx-3 px-3 lg:mx-0 lg:px-0 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max pb-2 lg:pb-0 lg:flex-wrap">
                {[
                  { key: 'all', label: 'All Orders', count: orders.length },
                  { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
                  { key: 'assigned', label: 'Assigned', count: orders.filter(o => o.status === 'assigned').length },
                  { key: 'out_for_delivery', label: 'Out for Delivery', count: orders.filter(o => o.status === 'out_for_delivery').length },
                  { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${statusFilter === filter.key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const statusBadge = getStatusBadge(order.status);
                const priorityBadge = getPriorityBadge(order.priority);

                return (
                  <div
                    key={order.orderId}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transform transition-all duration-300"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                    }}
                  >
                    {/* Order Header */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.orderId.substring(0, 8).toUpperCase()}
                            </h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bgColor} ${statusBadge.textColor}`}>
                              {statusBadge.icon}
                              {statusBadge.label}
                            </span>
                            {priorityBadge}
                            {order.paymentMethod === 'cod' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                COD: ${formatPrice(order.total)}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Customer:</span><br />
                              {order.shippingForm.firstName} {order.shippingForm.lastName}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span><br />
                              <a href={`tel:${order.shippingForm.phone}`} className="text-blue-600 hover:underline">
                                {order.shippingForm.phone}
                              </a>
                            </div>
                            <div>
                              <span className="font-medium">Items:</span><br />
                              {order.orderItems.length} item(s)
                            </div>
                            <div>
                              <span className="font-medium">Delivery by:</span><br />
                              {order.estimatedDelivery ? `${formatDate(order.estimatedDelivery)} ${formatTime(order.estimatedDelivery)}` : 'TBD'}
                            </div>
                          </div>

                          {/* Address */}
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <div className="flex items-start">
                              <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <div>
                                <p className="font-medium text-gray-900">Delivery Address:</p>
                                <p className="text-gray-700">{formatShippingAddress(order.shippingForm)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Delivery Notes */}
                          {order.deliveryNotes && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                              <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-blue-800">Delivery Instructions:</p>
                                  <p className="text-sm text-blue-700 mt-1">{order.deliveryNotes}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Order Timeline */}
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <h5 className="font-medium text-gray-900 mb-2">Order Timeline</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center text-gray-600">
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                <span>Created: {formatDate(order.createdat)} {formatTime(order.createdat)}</span>
                              </div>
                              {order.assignedat && (
                                <div className="flex items-center text-gray-600">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                  <span>Assigned: {formatDate(order.assignedat)} {formatTime(order.assignedat)}</span>
                                </div>
                              )}
                              {order.pickedat && (
                                <div className="flex items-center text-gray-600">
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                                  <span>Picked up: {formatDate(order.pickedat)} {formatTime(order.pickedat)}</span>
                                </div>
                              )}
                              {order.deliveredat && (
                                <div className="flex items-center text-gray-600">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                  <span>Delivered: {formatDate(order.deliveredat)} {formatTime(order.deliveredat)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3">
                            {getActionButtons(order)}

                            <button
                              onClick={() => toggleOrderExpansion(order.orderId)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transform transition-all duration-200 hover:scale-105 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {expandedOrder === order.orderId ? 'Hide' : 'View'} Items
                            </button>

                            {order.shippingForm.phone && (
                              <a
                                href={`tel:${order.shippingForm.phone}`}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transform transition-all duration-200 hover:scale-105 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                Call Customer
                              </a>
                            )}

                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transform transition-all duration-200 hover:scale-105 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                              </svg>
                              Get Directions
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Order Items */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedOrder === order.orderId ? 'max-h-screen opacity-100 mt-4' : 'max-h-0 opacity-0'
                          }`}
                      >
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-4">Order Items ({order.orderItems.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {order.orderItems.map((item) => (
                              <div
                                key={item._id}
                                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                  <Image width={500} height={500}
                                    src={item.image[0]}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    unoptimized={item.image?.[0]?.startsWith('/uploads')}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-300 rounded-lg hidden items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"></path>
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-gray-900 truncate">{item.name}</h5>
                                  <div className="text-sm text-gray-600">
                                    <p>Qty: {item.quantity} × ${formatPrice(item.price)}</p>
                                    {item.brand && <p>Brand: {item.brand}</p>}
                                    {item.category && <p>Category: {item.category}</p>}
                                  </div>
                                  <p className="text-sm font-medium text-gray-900">Total: ${formatPrice(item.price * item.quantity)}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order Total */}
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>Subtotal:</span>
                                <span>${formatPrice(order.subtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>Tax:</span>
                                <span>${formatPrice(order.tax)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>Shipping:</span>
                                <span>${formatPrice(order.shippingCost)}</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between items-center text-lg font-bold text-gray-900">
                                <span>Order Total:</span>
                                <span>${formatPrice(order.total)}</span>
                              </div>
                            </div>
                            {order.paymentMethod === 'cod' && (
                              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-sm text-orange-800 font-medium">⚠️ Cash on Delivery</p>
                                <p className="text-sm text-orange-700">Collect ${formatPrice(order.total)} from customer</p>
                              </div>
                            )}
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
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">No orders match your current filter selection.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Action Modal */}
      {deliveryModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full transform transition-all duration-300 scale-100">
            {(() => {
              const modalContent = getModalContent(deliveryModal.action);
              return (
                <>
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${modalContent.color === 'blue' ? 'bg-blue-100' : modalContent.color === 'orange' ? 'bg-orange-100' : 'bg-green-100'
                      }`}>
                      {modalContent.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {modalContent.title}
                    </h3>
                    <p className="text-gray-600">
                      {modalContent.message}
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setDeliveryModal({ show: false, orderId: null, action: null })}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(deliveryModal.orderId, modalContent.newStatus)}
                      className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors duration-200 ${modalContent.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : modalContent.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                      {modalContent.buttonText}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}