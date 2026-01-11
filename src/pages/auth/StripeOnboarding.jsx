import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';

export const OnboardingRefresh = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If user hits refresh, we should get a new link and redirect them again
    // In a real app, you might want to call the backend to get a fresh link immediately
    // For now, let's redirect to settings so they can click the button again
    const redirect = async () => {
        try {
            // Attempt to get a new link automatically
            const { data } = await api.post('/owner/stripe-connect/onboarding-link');
            if (data.url) window.location.href = data.url;
            else navigate('/settings');
        } catch (e) {
            navigate('/settings');
        }
    };
    redirect();
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-gray-600">Refreshing your session...</p>
    </div>
  );
};

export const OnboardingComplete = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // On success, redirect to login or settings
    setTimeout(() => {
        navigate('/auth/login');
    }, 3000);
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-green-50">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold text-green-900">Onboarding Complete!</h1>
      <p className="text-green-700 mt-2">Your account is now connected. Redirecting you to login...</p>
    </div>
  );
};