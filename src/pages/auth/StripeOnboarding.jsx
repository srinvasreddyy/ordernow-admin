import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

export const OnboardingRefresh = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If user hits refresh, we should get a new link and redirect them again
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
  const [status, setStatus] = useState('checking'); // checking, success, error

  useEffect(() => {
    const syncStatus = async () => {
        try {
            // Force a sync with the backend
            await api.post('/owner/stripe-connect/sync');
            setStatus('success');
            
            // Wait a moment so user sees the success message, then redirect
            setTimeout(() => {
                navigate('/auth/login');
            }, 2000);
        } catch (error) {
            console.error("Sync failed", error);
            setStatus('error');
        }
    };
    
    syncStatus();
  }, [navigate]);

  if (status === 'error') {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-4">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-red-900">Verification Pending</h1>
            <p className="text-red-700 mt-2">We couldn't verify your account status yet.</p>
            <button onClick={() => navigate('/settings')} className="mt-6 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                Return to Settings
            </button>
        </div>
      );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-green-50 text-center p-4">
      {status === 'checking' ? (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-green-900">Finalizing Setup...</h1>
            <p className="text-green-700 mt-2">Please wait while we confirm your details with Stripe.</p>
          </>
      ) : (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-green-900">All Set!</h1>
            <p className="text-green-700 mt-2">Your account is active. Redirecting...</p>
          </>
      )}
    </div>
  );
};