import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Edit, Save, AlertCircle, Mail, CheckCircle, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { isDarkMode } = useAppContext();
  const { currentUser, isAuthenticated, logout, updateProfile, sendVerificationEmail, isVerificationEmailSent } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || ''
  });
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(isVerificationEmailSent);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
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
    
    // Validate first name
    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }
    
    // Validate last name
    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }
    
    // Validate email
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    setFormErrors(newErrors);
    return isValid;
  };
  
  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        // Email update would typically require verification in a real app
        // For this demo, we'll just update it directly
        email: profileData.email
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendVerification = async () => {
    setVerificationSending(true);
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
    } catch (err) {
      console.error('Error sending verification email:', err);
    } finally {
      setVerificationSending(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };
  
  if (!isAuthenticated || !currentUser) {
    return (
      <div className={`min-h-screen pt-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <div className={`rounded-lg shadow-lg p-8 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-6">
                <User className="w-8 h-8 text-gray-500" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Profile</h1>
              
              <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Please sign in to view your profile.
              </p>
              
              <div className="flex flex-col space-y-4">
                <Link
                  to="/signin"
                  className="w-full py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors text-center"
                >
                  Sign In
                </Link>
                
                <Link
                  to="/signup"
                  className="w-full py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-100 transition-colors text-center"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen pt-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className={`rounded-lg shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Profile Header */}
            <div className={`p-6 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <div className="flex items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  currentUser.photoURL 
                    ? '' 
                    : isDarkMode ? 'bg-gray-600' : 'bg-blue-100'
                }`}>
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={`${currentUser.firstName} ${currentUser.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className={`w-8 h-8 ${isDarkMode ? 'text-gray-300' : 'text-blue-600'}`} />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h1 className="text-2xl font-bold">
                    {currentUser.firstName} {currentUser.lastName}
                  </h1>
                  <div className="flex items-center mt-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {currentUser.email}
                    </p>
                    {currentUser.isEmailVerified ? (
                      <span className="ml-2 flex items-center text-green-500 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="ml-2 flex items-center text-amber-500 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not verified
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-full ${
                    isDarkMode 
                      ? 'hover:bg-gray-600' 
                      : 'hover:bg-blue-100'
                  } transition-colors`}
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Email Verification Banner */}
            {!currentUser.isEmailVerified && (
              <div className={`p-4 ${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50'} border-y ${isDarkMode ? 'border-amber-800/30' : 'border-amber-100'}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <Mail className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`} />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                      Verify your email address
                    </h3>
                    <div className={`mt-1 text-sm ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                      <p>
                        Some features like adding items to cart or favorites will be limited until you verify your email.
                      </p>
                      <div className="mt-2">
                        {verificationSent ? (
                          <p className="flex items-center text-green-500">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verification email sent! Please check your inbox.
                          </p>
                        ) : (
                          <button
                            onClick={handleSendVerification}
                            disabled={verificationSending}
                            className={`px-3 py-1.5 text-sm rounded-md ${
                              isDarkMode 
                                ? 'bg-amber-800 hover:bg-amber-700 text-white' 
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                            } transition-colors`}
                          >
                            {verificationSending ? 'Sending...' : 'Send Verification Email'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Profile Content */}
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
                  
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {formErrors.firstName && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>
                  
                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.email}
                      </p>
                    )}
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Note: Changing your email will require re-verification.
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className={`flex items-center px-4 py-2 rounded-lg ${
                        isLoading 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white transition-colors`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data to current user data
                        setProfileData({
                          firstName: currentUser.firstName || '',
                          lastName: currentUser.lastName || '',
                          email: currentUser.email
                        });
                        // Clear any form errors
                        setFormErrors({
                          firstName: '',
                          lastName: '',
                          email: ''
                        });
                      }}
                      className={`px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'border-gray-600 hover:bg-gray-700' 
                          : 'border-gray-300 hover:bg-gray-100'
                      } transition-colors`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Name
                      </h3>
                      <p className="mt-1">
                        {currentUser.firstName} {currentUser.lastName}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Email
                      </h3>
                      <div className="mt-1 flex items-center">
                        <p>{currentUser.email}</p>
                        {currentUser.isEmailVerified && (
                          <span className="ml-2 flex items-center text-green-500 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Account Type
                      </h3>
                      <p className="mt-1 capitalize">
                        {currentUser.provider || 'Email'} Account
                      </p>
                    </div>
                    
                    <div>
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Member Since
                      </h3>
                      <p className="mt-1">
                        {currentUser.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Account Actions */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
                    
                    <div className="space-y-3">
                      {!currentUser.isEmailVerified && (
                        <Link
                          to="/verify-email"
                          className="flex items-center text-blue-600 hover:text-blue-700"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Verify Email Address
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center text-red-600 hover:text-red-700"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 