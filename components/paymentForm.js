'use client';

import { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
export default function PaymentForm({ orderId, amount, email, onSuccess, onError, handlePlaceOrder, createOrderInDatabase, agreedToTerms }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ask parent to validate and prepare. It should return an orderId string to proceed, or false to abort.
    let returnedOrderId = null;
    if (typeof handlePlaceOrder === 'function') {
      try {
        const result = await handlePlaceOrder();
        if (!result) return;
        // result should be the orderId string for card payments
        returnedOrderId = result;
      } catch (err) {
        console.error('Validation error from parent:', err);
        return;
      }
    }
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe is not loaded');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Payment Intent from your backend
      const orderIdToUse = returnedOrderId || orderId;
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          email,
          orderId: orderIdToUse,
        }),
      });

      const data = await response.json();


      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      // Step 2: Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            email,
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
        if (onError) onError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        setSuccess(true);
        // Pass orderId along with payment intent id so parent can create order in DB
        const usedOrderId = returnedOrderId || orderId;
        if (onSuccess) onSuccess(result.paymentIntent.id, usedOrderId);
      }
    } catch (err) {
      setError(err.message);

      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border border-gray-300 rounded-lg p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
              disableLink: true

            }}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">✓ Payment successful!</p>
            <p className="text-green-700 text-sm mt-1">Thank you for your purchase.</p>
          </div>
        )}

        <button
          type="submit"

          disabled={!stripe || loading || !agreedToTerms}
          className="w-full bg-gray-900 text-white py-4 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 mb-4"
        >
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </form>
    </>
  );
}
