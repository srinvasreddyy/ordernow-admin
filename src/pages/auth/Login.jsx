// src/pages/auth/Login.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowRight, Mail, Lock, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onRequestOTP = async (data) => {
    try {
      await api.post('/auth/owner/request-otp', { email: data.email });
      setEmail(data.email);
      setStep(2);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const onVerifyOTP = async (data) => {
    try {
      const response = await api.post('/auth/owner/verify-otp', { email, otp: data.otp });
      // ONLY if this succeeds (status 200) do we login
      login(response.data.owner);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      // Logic for 403 Forbidden (Pending Approval)
      if (error.response?.status === 403 && error.response?.data?.error_code === 'APPROVAL_PENDING') {
        toast((t) => (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Application Pending</p>
              <p className="text-sm text-gray-600">Please wait for Super Admin approval before logging in.</p>
            </div>
          </div>
        ), { duration: 6000 });
      } else {
        toast.error(error.response?.data?.message || 'Invalid OTP');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-cream">
      {/* Left promotional / branding column */}
      <aside className="w-full lg:w-1/2 hidden lg:flex items-center justify-center p-12 relative overflow-hidden bg-[#111214]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute -top-36 -left-36 w-[420px] h-[420px] bg-primary/20 rounded-full blur-[80px]" />
        <div className="relative z-10 max-w-lg text-left text-white">
          <h1 className="text-5xl font-extrabold leading-tight mb-4 tracking-tight">
            Order<span className="text-primary">Now</span>
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Run your restaurant, manage orders, and dispatch with a single professional dashboard.
          </p>
          <ul className="space-y-3 text-gray-300/90">
            <li className="flex items-start gap-3">
              <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2" />
              <span>Real-time order management</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2" />
              <span>Driver & fleet control</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2" />
              <span>Marketing & analytics</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Right form column */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-dark">Partner Login</h2>
              <p className="text-sm text-secondary mt-2">Sign in to access your dashboard</p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSubmit(onRequestOTP)} className="space-y-5">
                <div>
                  <label htmlFor="email" className="input-label">Email</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      {...register('email', { required: true })}
                      className="input-field pl-12 py-3"
                      placeholder="name@restaurant.com"
                      aria-label="Email address"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center gap-3 py-3"
                >
                  {isSubmitting ? 'Checking...' : 'Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center text-sm text-secondary">
                  New here?{' '}
                  <Link to="/auth/register" className="text-primary font-bold hover:underline">
                    Apply as partner
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onVerifyOTP)} className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="otp" className="input-label">One-Time Password</label>
                    <p className="text-xs text-secondary">Sent to <span className="font-medium text-dark">{email}</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Change Email
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="otp"
                    type="text"
                    {...register('otp', { required: true })}
                    className="input-field pl-12 py-3 tracking-widest text-center font-semibold text-lg"
                    placeholder="••••••"
                    maxLength={6}
                    inputMode="numeric"
                    autoFocus
                    aria-label="One time password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center gap-3 py-3"
                >
                  {isSubmitting ? 'Verifying...' : 'Access Dashboard'}
                </button>

                <div className="text-center text-sm text-secondary">
                  Didn't receive email?{' '}
                  <button type="button" onClick={() => setStep(1)} className="text-primary font-bold hover:underline">Resend</button>
                </div>
              </form>
            )}
          </div>

          <div className="px-6 py-4 bg-cream/50 text-center text-xs text-secondary border-t border-gray-100">
            By signing in you agree to our <span className="text-primary font-semibold">Terms & Privacy</span>.
          </div>
        </div>
      </main>
    </div>
  );
}