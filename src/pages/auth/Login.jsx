import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowRight, Mail, Lock } from 'lucide-react';

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
      login(response.data.owner);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 bg-[#1A1C1E] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]"></div>
        <div className="relative z-10 text-center text-white max-w-lg">
            <h1 className="text-6xl font-extrabold mb-6 tracking-tight">Order<span className="text-primary">Now</span></h1>
            <p className="text-lg text-gray-400 leading-relaxed">Control your restaurant operations, delivery fleet, and marketing from a single professional dashboard.</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-cream">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-gray-100 animate-scale-in">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-dark">Partner Login</h2>
            <p className="text-secondary mt-2">Enter your credentials to access the panel.</p>
          </div>

          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleSubmit(onRequestOTP)}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-dark">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    {...register('email', { required: true })}
                    className="input-field pl-12 py-3"
                    placeholder="name@restaurant.com"
                  />
                </div>
              </div>
              
              <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3 text-base shadow-lg shadow-primary/20">
                {isSubmitting ? 'Checking...' : 'Continue'} <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form className="space-y-6 animate-slide-in-right" onSubmit={handleSubmit(onVerifyOTP)}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-dark">One-Time Password</label>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-primary font-bold hover:underline">Change Email</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    {...register('otp', { required: true })}
                    className="input-field pl-12 py-3 tracking-[0.5em] text-center font-bold text-lg"
                    placeholder="••••••"
                    maxLength={6}
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3 text-base shadow-lg shadow-primary/20">
                {isSubmitting ? 'Verifying...' : 'Access Dashboard'}
              </button>
            </form>
          )}

          <div className="mt-10 text-center text-sm text-secondary">
            Interested in partnering?{' '}
            <Link to="/auth/register" className="font-bold text-primary hover:underline">Apply Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}