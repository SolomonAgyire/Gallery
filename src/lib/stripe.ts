import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing Stripe publishable key. Please check your .env file.');
}

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const redirectToStripeCheckout = async (cart: any[]) => {
  try {
    console.log('Creating checkout with items:', cart.length);
    
    // Call our backend to create a Stripe checkout session
    const response = await fetch('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    
    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
}; 