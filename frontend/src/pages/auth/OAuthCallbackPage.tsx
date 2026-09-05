import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Sparkles } from 'lucide-react';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      setToken(token).then(() => {
        navigate('/dashboard');
      });
    } else if (error) {
      navigate('/login?error=' + error);
    } else {
      navigate('/login');
    }
  }, [searchParams, setToken, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-text">Signing you into NaTask...</h2>
        <p className="text-sm text-muted">Please wait while we verify your session.</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
