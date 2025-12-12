"use client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import LoadingScreen from '@/components/LoadingScreen';
import { useState, use, useEffect } from 'react';

export default function ReviewsPage({ params }) {
    const productId = decodeURIComponent(use(params).productId);
    const [sortBy, setSortBy] = useState('recent');
    const [filterRating, setFilterRating] = useState('all');
    const [matchedItem, setmatchedItem] = useState([])
    const [filteredreviews, setfilteredreviews] = useState([])
    const [avgrating, setavgrating] = useState(0)
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    useEffect(() => {
        (async () => {
            const product = await fetch("/api/products")
            const response = await product.json()
            const mathceditem = response.filter(i => i.productid === productId)
            setmatchedItem(mathceditem)

            const reviews = await fetch("/api/review")
            const reviewResponse = await reviews.json()
            const filteredReviews = reviewResponse.filter(r => r.productId === productId);
            setfilteredreviews(filteredReviews);
            setavgrating(filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length);

        })()
    }, [productId]);

    const renderStars = (rating, size = 'text-lg') => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`${size} text-yellow-500`}>
                        {star <= fullStars ? '★' : (star === fullStars + 1 && hasHalfStar ? '★' : '☆')}
                    </span>
                ))}
            </div>
        );
    };
    if (matchedItem.length !== 1) {
        return <LoadingScreen message="Loading reviews..." />;
    }
    const getRatingDistribution = () => {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        filteredreviews.forEach(review => {
            distribution[review.rating]++;
        });
        return distribution;
    };

    const ratingDistribution = getRatingDistribution();
    

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="grow">
                {/* Header */}
                <div className="bg-white border-b-2 border-blue-600 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                        <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    {/* Product Summary */}
                    {matchedItem.map(item => (
                        <div key={item._id} className="bg-white border-2 border-blue-200 rounded-lg shadow-sm p-6 mb-8">
                            <div className="flex  sm:flex-row gap-6 items-start">
                                <Image
                                    width={500} height={500}
                                    src={(() => {
                                        const productImage = item?.variants?.[0]?.images?.[0];
                                        const productSlug = item?.name?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                        return productImage || `/uploads/products/${productSlug}.png`;
                                    })()}
                                    alt={item.name}
                                    priority
                                    className="  rounded-lg border-2 border-gray-200"
                                    unoptimized={!item?.variants?.[0]?.images?.[0]?.startsWith('http')}
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-blue-600 font-semibold mb-1 uppercase">{item.brand}</p>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h2>
                                    <p className="text-gray-600  text-lg mb-4 line-clamp-2">{item.description}</p>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            {renderStars(avgrating)}
                                            <span className="text-2xl font-bold text-gray-900">{avgrating.toFixed(1)}</span>
                                            <span className="text-gray-600">out of 5</span>
                                        </div>
                                    </div>

                                    {item.variants[0]?.salePrice && (
                                        <div className="mt-4 flex items-baseline gap-3">
                                            <span className="text-2xl font-bold text-blue-600">${item.variants[0].salePrice.toFixed(2)}</span>
                                            <span className="text-lg text-gray-500 line-through">${item.variants[0].price.toFixed(2)}</span>
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">SALE</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>))}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar - Rating Distribution */}
                        <div className="lg:col-span-1">
                            <div className="bg-white border-2 border-blue-200 rounded-lg shadow-sm p-6 sticky top-4">
                                <h3 className="font-bold text-lg text-gray-900 mb-4">Rating Breakdown</h3>
                                {[5, 4, 3, 2, 1].map((rating) => {
                                    const count = ratingDistribution[rating];
                                    const percentage = filteredreviews.length > 0 ? (count / filteredreviews.length) * 100 : 0;
                                    return (
                                        <div key={rating} className="flex items-center gap-3 mb-3">
                                            <span className="text-sm font-semibold text-gray-700 w-12">{rating} star</span>
                                            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 w-8 text-right">{count}</span>
                                        </div>
                                    );
                                })}


                            </div>
                        </div>

                        {/* Main Content - Reviews List */}
                        <div className="lg:col-span-3">
                            {/* Filters */}
                            {/* <div className="bg-white border-2 border-blue-200 rounded-lg shadow-sm p-4 mb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full border-2 border-blue-200 rounded-lg px-4 py-2.5 text-gray-700 bg-white focus:outline-none focus:border-blue-600 transition-colors"
                                    >
                                        <option value="recent">Most Recent</option>
                                        <option value="helpful">Most Helpful</option>
                                        <option value="highest">Highest Rating</option>
                                        <option value="lowest">Lowest Rating</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Rating</label>
                                    <select
                                        value={filterRating}
                                        onChange={(e) => setFilterRating(e.target.value)}
                                        className="w-full border-2 border-blue-200 rounded-lg px-4 py-2.5 text-gray-700 bg-white focus:outline-none focus:border-blue-600 transition-colors"
                                    >
                                        <option value="all">All Ratings</option>
                                        <option value="5">5 Stars Only</option>
                                        <option value="4">4 Stars & Up</option>
                                        <option value="3">3 Stars & Up</option>
                                        <option value="2">2 Stars & Up</option>
                                        <option value="1">1 Star & Up</option>
                                    </select>
                                </div>
                            </div>
                        </div> */}

                            {/* Reviews Count */}
                            <div className="mb-4">
                                <p className="text-gray-700 font-medium">total {filteredreviews.length} reviews</p>
                            </div>

                            {/* Reviews */}
                            <div className="space-y-4">
                                {filteredreviews.map((review) => (
                                    <div key={review._id} className="bg-white border-2 border-blue-100 rounded-lg shadow-sm p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                                        {/* Review Header */}
                                        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                                                    {review.userId.avatar}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-gray-900">{review.userId.name}</h4>
                                                        {review.verified && (
                                                            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded border border-blue-200">
                                                                ✓ Verified Purchase
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-0.5">{formatDate(review.createdAt)}</p>
                                                </div>
                                            </div>
                                            {renderStars(review.rating, 'text-xl')}
                                        </div>

                                        {/* Review Content */}
                                        <h3 className="font-bold text-xl text-gray-900 mb-3">{review.title}</h3>
                                        <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

                                        {/* Review Footer */}
                                        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                                                <span className="text-lg">👍</span>
                                                <span className="text-sm font-medium">Helpful ({review.helpfulCount})</span>
                                            </button>
                                            <button className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
                                                Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}