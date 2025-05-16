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
  const { login, isLoading, error, isAuthenticated, currentUser, sendVerificationEmail, isVerificationEmailSent, loginWithGoogle } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = {
      email: !formData.email ? 'Email is required' : !validateEmail(formData.email) ? 'Invalid email format' : '',
      password: !formData.password ? 'Password is required' : ''
    };
    
    setFormErrors(errors);
    
    if (Object.values(errors).some(error => error)) {
      return;
    }

    try {
      await login(formData.email, formData.password);
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

          {/* Google Sign-in Button */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={() => loginWithGoogle()}
              className={`mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                isDarkMode 
                  ? 'bg-white text-gray-700 hover:bg-gray-50' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 