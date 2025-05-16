import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Validate request body
const validateCheckoutRequest = (req, res, next) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Invalid request: items array is required and must not be empty' 
    });
  }

  const validItems = items.every(item => 
    item.title && 
    typeof item.price === 'number' && 
    item.price > 0
  );

  if (!validItems) {
    return res.status(400).json({ 
      error: 'Invalid request: each item must have a title and valid price' 
    });
  }

  next();
};

// Create checkout session
app.post('/api/create-checkout-session', validateCheckoutRequest, async (req, res) => {
  try {
    const { items } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            description: item.description,
            images: [item.imageUrl],
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity || 1,
      })),
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: {
        // Add any additional metadata you want to track
        orderType: 'artwork_purchase'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Verify checkout session
app.get('/api/verify-session', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ 
        verified: false,
        error: 'Session ID is required' 
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // Here you would typically:
      // 1. Update your database
      // 2. Clear the user's cart
      // 3. Send confirmation emails
      // 4. etc.
      
      res.json({ 
        verified: true,
        customerEmail: session.customer_details?.email,
        amount: session.amount_total / 100 // Convert from cents
      });
    } else {
      res.json({ 
        verified: false,
        status: session.payment_status 
      });
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ 
      verified: false,
      error: 'Failed to verify session',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Stripe key configured:', !!process.env.STRIPE_SECRET_KEY);
  console.log('Client URL:', process.env.CLIENT_URL);
}); 