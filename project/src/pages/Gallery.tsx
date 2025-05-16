import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Video } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Gallery = () => {
  const { 
    addToCart, 
    isInCart, 
    addToFavorites, 
    removeFromFavorites, 
    isInFavorites, 
    isDarkMode,
    artworks
  } = useAppContext();
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [hoveredArtwork, setHoveredArtwork] = useState<string | null>(null);
  const [showARTooltip, setShowARTooltip] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalAction, setAuthModalAction] = useState<'cart' | 'favorite'>('cart');

  const handleAddToCart = (artworkId: string) => {
    if (!isAuthenticated) {
      setAuthModalAction('cart');
      setShowAuthModal(true);
      return;
    }
    
    const artwork = artworks.find(a => a.id === artworkId);
    if (artwork) {
      addToCart(artwork);
    }
  };

  const handleFavoriteToggle = (artworkId: string) => {
    if (!isAuthenticated) {
      setAuthModalAction('favorite');
      setShowAuthModal(true);
      return;
    }
    
    if (isInFavorites(artworkId)) {
      removeFromFavorites(artworkId);
    } else {
      addToFavorites(artworkId);
    }
  };

  const handleARPreview = (artworkId: string) => {
    navigate(`/ar-preview/${artworkId}`);
  };

  const handleSignIn = () => {
    navigate('/signin', { 
      state: { 
        from: '/gallery',
        message: authModalAction === 'cart' 
          ? 'Sign in to add items to your cart' 
          : 'Sign in to add items to your favorites'
      } 
    });
    setShowAuthModal(false);
  };

  const handleSignUp = () => {
    navigate('/signup', { 
      state: { 
        from: '/gallery',
        message: authModalAction === 'cart' 
          ? 'Create an account to add items to your cart' 
          : 'Create an account to add items to your favorites'
      } 
    });
    setShowAuthModal(false);
  };

  return (
    <div className={`min-h-screen pt-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Art Gallery</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map(artwork => (
            <motion.div
              key={artwork.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-lg overflow-hidden shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              onMouseEnter={() => setHoveredArtwork(artwork.id)}
              onMouseLeave={() => {
                setHoveredArtwork(null);
                setShowARTooltip(null);
              }}
            >
              <div className="relative h-64">
                <img 
                  src={artwork.imageUrl} 
                  alt={artwork.title} 
                  className="w-full h-full object-cover transition-transform duration-300 ease-in-out transform hover:scale-105"
                />
                <div 
                  className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-center transition-opacity duration-300 ${
                    hoveredArtwork === artwork.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div>
                    <h3 className="text-white font-medium">{artwork.title}</h3>
                    <p className="text-gray-300 text-sm">{artwork.artist}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFavoriteToggle(artwork.id)}
                      className={`p-2 rounded-full ${
                        isAuthenticated && isInFavorites(artwork.id) 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      } text-white transition-colors`}
                      aria-label={isAuthenticated && isInFavorites(artwork.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-5 h-5 ${isAuthenticated && isInFavorites(artwork.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleAddToCart(artwork.id)}
                      className={`p-2 rounded-full ${
                        isAuthenticated && isInCart(artwork.id) 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white transition-colors`}
                      aria-label={isAuthenticated && isInCart(artwork.id) ? "Added to cart" : "Add to cart"}
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => handleARPreview(artwork.id)}
                        onMouseEnter={() => setShowARTooltip(artwork.id)}
                        onMouseLeave={() => setShowARTooltip(null)}
                        className="p-2 rounded-full bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                        aria-label="View in AR with camera"
                      >
                        <Video className="w-5 h-5" />
                      </button>
                      {showARTooltip === artwork.id && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          Try on your wall with camera
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-lg font-semibold">
                    ${artwork.price.toLocaleString()}
                  </p>
                  {artwork.dimensions && (
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {artwork.dimensions}
                    </p>
                  )}
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {artwork.description.substring(0, 100)}
                  {artwork.description.length > 100 ? '...' : ''}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} max-w-md w-full mx-4`}>
            <h2 className="text-xl font-semibold mb-4">Sign in required</h2>
            <p className="mb-6">
              {authModalAction === 'cart' 
                ? 'Please sign in to add items to your cart.' 
                : 'Please sign in to add items to your favorites.'}
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleSignIn}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};