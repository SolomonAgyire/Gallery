import { loadStripe } from '@stripe/stripe-js';

// Log the environment variable (without exposing the full key)
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
console.log('Stripe key available:', !!publishableKey);
console.log('Stripe key prefix:', publishableKey?.substring(0, 7));

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(publishableKey);

// Function to handle checkout process
export async function redirectToStripeCheckout(cart: any[]) {
  try {
    const response = await fetch('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    
    // Redirect to Stripe checkout
    window.location.href = url;
  } catch (error) {
    console.error('Error in redirectToCheckout:', error);
    throw error;
  }
} 