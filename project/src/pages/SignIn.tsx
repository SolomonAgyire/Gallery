import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Mail, CheckCircle, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  from?: { pathname: string };
  message?: string;
}

export const SignIn = () => {
  const { isDarkMode } = useAppContext();
  const { login, isLoading, error, isAuthenticated, currentUser, sendVerificationEmail, isVerificationEmailSent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path and message from location state
  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/';
  const message = state?.message;
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Check if email verification is needed
      if (currentUser && !currentUser.isEmailVerified && currentUser.provider === 'email') {
        setShowVerificationBanner(true);
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from, currentUser]);
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...formErrors };
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    
    setFormErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login(formData.email, formData.password);
      // Redirect happens in useEffect
    } catch (err) {
      console.error('Login error:', err);
    }
  };
  
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim() || !validateEmail(forgotPasswordEmail)) {
      return;
    }
    
    try {
      await login(forgotPasswordEmail, 'Password123');
      setForgotPasswordSuccess(true);
      
      // Show success message for 3 seconds, then redirect
      setTimeout(() => {
        if (isAuthenticated) {
          navigate(from, { replace: true });
        }
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
    }
  };
  
  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setForgotPasswordSuccess(false);
    if (!showForgotPassword) {
      setForgotPasswordEmail(formData.email);
    }
  };
  
  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
    } catch (err) {
      console.error('Error sending verification email:', err);
    }
  };
  
  const handleContinueAnyway = () => {
    setShowVerificationBanner(false);
    navigate(from, { replace: true });
  };

  const useDemoAccount = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'Password123'
    });
  };
  
  return (
    <div className={`min-h-screen pt-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          {/* Email Verification Banner */}
          {showVerificationBanner && currentUser && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} border ${isDarkMode ? 'border-blue-800' : 'border-blue-100'}`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <Mail className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                    Verify your email address
                  </h3>
                  <div className={`mt-2 text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                    <p>
                      We've sent a verification email to <span className="font-medium">{currentUser.email}</span>.
                      Please check your inbox and click the verification link.
                    </p>
                    <div className="mt-4 flex space-x-4">
                      {isVerificationEmailSent ? (
                        <p className="flex items-center text-green-500">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verification email sent!
                        </p>
                      ) : (
                        <button
                          onClick={handleResendVerification}
                          className={`px-3 py-1 text-sm rounded-md ${
                            isDarkMode 
                              ? 'bg-blue-800 hover:bg-blue-700 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          } transition-colors`}
                        >
                          Resend Email
                        </button>
                      )}
                      <button
                        onClick={handleContinueAnyway}
                        className={`px-3 py-1 text-sm rounded-md ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600' 
                            : 'bg-gray-200 hover:bg-gray-300'
                        } transition-colors`}
                      >
                        Continue Anyway
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Message from Gallery */}
          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'} border ${isDarkMode ? 'border-indigo-800' : 'border-indigo-100'}`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                    {message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {showForgotPassword ? (
            <div className={`rounded-lg shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h1 className={`text-2xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Reset Password
              </h1>
              
              {forgotPasswordSuccess ? (
                <div className="p-4 bg-green-100 text-green-700 rounded-lg mb-4">
                  <p className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Your password has been reset to <strong>Password123</strong>. You can now sign in with this temporary password.
                  </p>
                </div>
              ) : (
                <>
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Enter your email address and we'll reset your password to a temporary one.
                  </p>
                  
                  <form onSubmit={handleForgotPasswordSubmit}>
                    <div className="mb-4">
                      <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="forgotPasswordEmail"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading || !forgotPasswordEmail || !validateEmail(forgotPasswordEmail)}
                      className={`w-full py-3 rounded-lg font-medium text-white ${
                        isLoading || !forgotPasswordEmail || !validateEmail(forgotPasswordEmail)
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } transition-colors`}
                    >
                      {isLoading ? 'Processing...' : 'Reset Password'}
                    </button>
                  </form>
                </>
              )}
              
              <div className="mt-4 text-center">
                <button
                  onClick={toggleForgotPassword}
                  className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Sign In
              </h1>
              
              <div className={`rounded-lg shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    <p className="flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {error}
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="password" className="block text-sm font-medium">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={toggleForgotPassword}
                        className={`text-xs ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 rounded-lg font-medium text-white ${
                      isLoading 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } transition-colors`}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
                
                {/* Demo Account Button */}
                <div className="mt-4">
                  <button
                    onClick={useDemoAccount}
                    className={`w-full py-2 rounded-lg font-medium text-sm ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } transition-colors`}
                  >
                    Use Demo Account
                  </button>
                  <p className={`mt-1 text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    For testing purposes only
                  </p>
                </div>
                
                <div className="mt-6 text-center">
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-blue-600 hover:underline">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}; 