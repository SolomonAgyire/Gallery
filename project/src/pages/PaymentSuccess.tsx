import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const PaymentSuccess = () => {
  const { isDarkMode, clearCart } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      navigate('/cart');
      return;
    }

    // Verify the session with the backend
    fetch(`http://localhost:5000/api/verify-session?session_id=${sessionId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to verify payment');
        }
        return res.json();
      })
      .then(data => {
        setVerifying(false);
        
        if (!data.verified) {
          setError('Payment verification failed. Please contact support.');
          return;
        }

        // Clear the cart after successful payment
        clearCart();
        
        // Redirect after 5 seconds
        setTimeout(() => {
          navigate('/gallery');
        }, 5000);
      })
      .catch((err) => {
        setVerifying(false);
        setError(err.message || 'An error occurred during payment verification');
        console.error('Payment verification error:', err);
      });
  }, [navigate, searchParams, clearCart]);

  if (verifying) {
    return (
      <div className={`min-h-screen pt-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className={`max-w-2xl mx-auto text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8`}>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <h1 className="text-2xl font-bold mb-4">Verifying Payment...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen pt-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className={`max-w-2xl mx-auto text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8`}>
            <div className="flex justify-center mb-6">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Payment Error</h1>
            <p className="text-lg mb-6">{error}</p>
            <button
              onClick={() => navigate('/cart')}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`max-w-2xl mx-auto text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8`}>
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          
          <p className="text-lg mb-6">
            Thank you for your purchase. Your order has been confirmed and will be processed shortly.
          </p>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              You will be redirected to the gallery in a few seconds...
            </p>
            
            <button
              onClick={() => navigate('/gallery')}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Gallery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 