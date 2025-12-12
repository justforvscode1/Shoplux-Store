"use client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, use, useCallback, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Memoized Star Icon component for performance
const StarIcon = memo(({ filled, size = "w-8 h-8 md:w-10 md:h-10" }) => (
  <svg
    className={`${size} transition-all duration-200`}
    viewBox="0 0 24 24"
    fill={filled ? "#2563eb" : "none"}
    stroke="#2563eb"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
));
StarIcon.displayName = 'StarIcon';

// Rating labels for accessibility
const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

export default function ProductReviewPage({ params }) {
  const productId = decodeURIComponent(use(params).productId);

  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    images: [],
    productId
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must not exceed 100 characters';
    }

    if (formData.comment.trim() && formData.comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters';
    } else if (formData.comment.trim().length > 1000) {
      newErrors.comment = 'Comment must not exceed 1000 characters';
    }

    if (formData.images.length > 5) {
      newErrors.images = 'Maximum 5 images allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const sendingReview = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (sendingReview.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setFormData({ rating: 0, title: '', comment: '', images: [], productId });
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) {
      setErrors(prev => ({ ...prev, images: 'Maximum 5 images allowed' }));
      return;
    }

    files.forEach(file => {
      // Compress and resize images for optimization
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });

    setErrors(prev => ({ ...prev, images: '' }));
  }, [formData.images.length]);

  const removeImage = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  }, []);

  const handleRatingClick = useCallback((star) => {
    setFormData(prev => ({ ...prev, rating: star }));
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  if (submitSuccess) {
    return (
      <div className="min-h-dvh bg-linear-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6">
        <div
          className="text-center bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md mx-auto animate-[fadeIn_0.3s_ease-out]"
          role="alert"
          aria-live="polite"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Review Submitted!</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8">Thank you for your feedback. Your review is pending approval.</p>
          <Link
            href={`/product/${productId}`}
            className="inline-block bg-blue-600 text-white text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Back to Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className=" min-h-dvh bg-linear-to-b from-gray-50 to-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8   md:py-10 lg:py-12 grow w-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 md:p-8 lg:p-10"
          noValidate
        >
          {/* Rating Section */}
          <fieldset className="mb-8 sm:mb-10">
            <legend className="block text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
              Rating <span className="text-red-500" aria-label="required">*</span>
            </legend>
            <div
              className="flex gap-2 sm:gap-3 md:gap-4"
              role="radiogroup"
              aria-label="Product rating"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onFocus={() => setHoveredRating(star)}
                  onBlur={() => setHoveredRating(0)}
                  className="p-1 sm:p-1.5 transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg touch-manipulation"
                  aria-label={`Rate ${star} out of 5 stars - ${RATING_LABELS[star]}`}
                  aria-pressed={formData.rating === star}
                >
                  <StarIcon filled={star <= (hoveredRating || formData.rating)} />
                </button>
              ))}
            </div>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-2 sm:mt-3 min-h-[1.5em]" aria-live="polite">
              {formData.rating === 0 ? "Tap to rate" : RATING_LABELS[formData.rating]}
            </p>
            {errors.rating && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1" role="alert">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.rating}
              </p>
            )}
          </fieldset>

          {/* Title */}
          <div className="mb-6 sm:mb-8">
            <label
              htmlFor="title"
              className="block text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-3"
            >
              Review Title <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-3 sm:py-3.5 md:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm sm:text-base md:text-lg placeholder:text-gray-400"
              placeholder="Summarize your experience"
              maxLength={100}
              aria-describedby="title-counter title-error"
              aria-invalid={!!errors.title}
            />
            <div className="flex justify-between items-start mt-2 gap-4">
              <div className="flex-1">
                {errors.title && (
                  <p id="title-error" className="text-xs sm:text-sm text-red-600 flex items-center gap-1" role="alert">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.title}
                  </p>
                )}
              </div>
              <p id="title-counter" className="text-xs sm:text-sm text-gray-400 tabular-nums">{formData.title.length}/100</p>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6 sm:mb-8">
            <label
              htmlFor="comment"
              className="block text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-3"
            >
              Your Review <span className="text-gray-400 font-normal text-xs sm:text-sm">(Optional)</span>
            </label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              rows={5}
              className="w-full px-4 py-3 sm:py-3.5 md:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none resize-none text-sm sm:text-base md:text-lg placeholder:text-gray-400"
              placeholder="Tell us more about your experience..."
              maxLength={1000}
              aria-describedby="comment-counter comment-error"
              aria-invalid={!!errors.comment}
            />
            <div className="flex justify-between items-start mt-2 gap-4">
              <div className="flex-1">
                {errors.comment && (
                  <p id="comment-error" className="text-xs sm:text-sm text-red-600 flex items-center gap-1" role="alert">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.comment}
                  </p>
                )}
              </div>
              <p id="comment-counter" className="text-xs sm:text-sm text-gray-400 tabular-nums">{formData.comment.length}/1000</p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-8 sm:mb-10">
            <label className="block text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
              Add Photos <span className="text-gray-400 font-normal text-xs sm:text-sm">(Optional)</span>
            </label>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Upload up to 5 images to share with other customers</p>

            {/* Image Previews Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 xs:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group aspect-square">
                    <div className="w-full h-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                      <Image
                        src={img}
                        alt={`Preview ${index + 1}`}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover"
                        unoptimized
                        loading="lazy"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-base font-bold shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.images.length < 5 && (
              <label className="cursor-pointer block group">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 md:p-10 hover:border-blue-500 hover:bg-blue-50/50 active:border-blue-600 transition-all duration-200 group-focus-within:ring-2 group-focus-within:ring-blue-500 group-focus-within:border-blue-500">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors duration-200">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm sm:text-base md:text-lg text-gray-700 font-medium">Tap to upload images</span>
                    <span className="text-xs sm:text-sm text-gray-400 mt-1">{formData.images.length}/5 uploaded</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                  aria-label="Upload images"
                />
              </label>
            )}

            {errors.images && (
              <p className="mt-3 text-xs sm:text-sm text-red-600 flex items-center gap-1" role="alert">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.images}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white py-3.5 sm:py-4 md:py-5 px-6 rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-lg touch-manipulation"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2 sm:gap-3">
                <svg className="animate-spin w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Submitting your review...</span>
              </span>
            ) : 'Submit Review'}
          </button>
        </form>

        {/* Guidelines Card */}
        <aside className="mt-6 sm:mt-8 p-4 sm:p-5 md:p-6 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review Guidelines
          </h3>
          <ul className="text-xs sm:text-sm md:text-base text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Be honest and helpful to other shoppers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Focus on the product features and your experience</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Avoid inappropriate language or personal info</span>
            </li>
          </ul>
        </aside>
      </main>
      <Footer />
    </div>
  );
}