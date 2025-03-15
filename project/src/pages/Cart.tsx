import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, CreditCard, Plus, Minus, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Cart = () => {
  const { cart, removeFromCart, updateCartItemQuantity, cartTotal, isDarkMode } = useAppContext();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });
  const [paymentErrors, setPaymentErrors] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });
  const [orderComplete, setOrderComplete] = useState(false);

  // Redirect if not authenticated (handled by ProtectedRoute in App.tsx)
  // This is just a fallback
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/signin', { state: { from: { pathname: '/cart' } } });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear error when user types
    if (paymentErrors[name as keyof typeof paymentErrors]) {
      setPaymentErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (cleaned.length <= 16) {
        // Format with spaces after every 4 digits
        const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
        setPaymentInfo(prev => ({
          ...prev,
          [name]: formatted
        }));
      }
    } 
    // Format expiry date with slash
    else if (name === 'expiry') {
      const cleaned = value.replace(/[^0-9]/gi, '');
      if (cleaned.length <= 4) {
        let formatted = cleaned;
        if (cleaned.length > 2) {
          formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
        }
        setPaymentInfo(prev => ({
          ...prev,
          [name]: formatted
        }));
      }
    } 
    // Handle other fields normally
    else {
      setPaymentInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validatePaymentInfo = () => {
    const errors = {
      cardNumber: '',
      cardName: '',
      expiry: '',
      cvv: '',
    };
    let isValid = true;

    // Validate card number (16 digits)
    const cardNumberClean = paymentInfo.cardNumber.replace(/\s+/g, '');
    if (!cardNumberClean) {
      errors.cardNumber = 'Card number is required';
      isValid = false;
    } else if (!/^\d{16}$/.test(cardNumberClean)) {
      errors.cardNumber = 'Card number must be 16 digits';
      isValid = false;
    }

    // Validate card name
    if (!paymentInfo.cardName.trim()) {
      errors.cardName = 'Name on card is required';
      isValid = false;
    }

    // Validate expiry date (MM/YY format)
    if (!paymentInfo.expiry) {
      errors.expiry = 'Expiry date is required';
      isValid = false;
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentInfo.expiry)) {
      errors.expiry = 'Expiry date must be in MM/YY format';
      isValid = false;
    } else {
      // Check if card is expired
      const [month, year] = paymentInfo.expiry.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
      const today = new Date();
      if (expiryDate < today) {
        errors.expiry = 'Card is expired';
        isValid = false;
      }
    }

    // Validate CVV (3-4 digits)
    if (!paymentInfo.cvv) {
      errors.cvv = 'CVV is required';
      isValid = false;
    } else if (!/^\d{3,4}$/.test(paymentInfo.cvv)) {
      errors.cvv = 'CVV must be 3 or 4 digits';
      isValid = false;
    }

    setPaymentErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePaymentInfo()) {
      return;
    }
    
    // Here you would typically process the payment
    // For demo purposes, we'll just simulate a successful payment
    setTimeout(() => {
      setOrderComplete(true);
    }, 1500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      updateCartItemQuantity(itemId, newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen pt-20 flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        {cart.length === 0 && !orderComplete ? (
          <div className={`text-center py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
            <p className="text-xl mb-4">Your cart is empty</p>
            <a href="/gallery" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Browse Gallery
            </a>
          </div>
        ) : orderComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}
          >
            <h2 className="text-2xl font-semibold mb-4">Thank You for Your Order!</h2>
            <p className="mb-6">Your order has been placed successfully.</p>
            <a href="/gallery" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Continue Shopping
            </a>
          </motion.div>
        ) : !isCheckingOut ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className={`rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cart.map(item => (
                    <li key={item.id} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center">
                        <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden mr-6 mb-4 sm:mb-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium">{item.title}</h3>
                          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.artist}</p>
                          {item.dimensions && (
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {item.dimensions}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end mt-4 sm:mt-0">
                          <span className="text-lg font-medium mb-2">
                            {formatPrice(item.price * (item.quantity || 1))}
                          </span>
                          
                          {/* Quantity Selector */}
                          <div className="flex items-center mb-3">
                            <button
                              onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                              disabled={(item.quantity || 1) <= 1}
                              className={`p-1 rounded ${
                                (item.quantity || 1) <= 1 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="mx-2 w-8 text-center">{item.quantity || 1}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                              disabled={(item.quantity || 1) >= 10}
                              className={`p-1 rounded ${
                                (item.quantity || 1) >= 10 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Checkout</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      id="cardName"
                      name="cardName"
                      value={paymentInfo.cardName}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="John Doe"
                    />
                    {paymentErrors.cardName && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {paymentErrors.cardName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={paymentInfo.cardNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="1234 5678 9012 3456"
                    />
                    {paymentErrors.cardNumber && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {paymentErrors.cardNumber}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiry" className="block text-sm font-medium mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        id="expiry"
                        name="expiry"
                        value={paymentInfo.expiry}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="MM/YY"
                      />
                      {paymentErrors.expiry && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {paymentErrors.expiry}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={paymentInfo.cvv}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="123"
                      />
                      {paymentErrors.cvv && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {paymentErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCheckingOut(false)}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Complete Purchase
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 