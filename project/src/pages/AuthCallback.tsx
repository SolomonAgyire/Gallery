import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createClient } from '@supabase/supabase-js';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { error } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          // Successfully authenticated
          navigate('/', { replace: true });
        } else {
          // No session found
          navigate('/signin', { 
            state: { 
              error: 'Authentication failed. Please try again.' 
            } 
          });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/signin', { 
          state: { 
            error: 'Authentication failed. Please try again.' 
          } 
        });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}; 