import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Mail, ShieldCheck, ArrowRight, PlayCircle } from 'lucide-react';

const RegistrationSuccess = () => {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center border border-gray-100">
        
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-extrabold text-dark mb-4">Registration Successful!</h1>
        <p className="text-secondary text-lg mb-8 max-w-lg mx-auto">
            Welcome to OrderNow. Your account has been created and is currently <span className="font-bold text-orange-500">Pending Approval</span>.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5" /> Next Steps:
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-blue-800 text-sm">
                <li>
                    <strong>Contact Super Admin:</strong> Please email the administration to expedite your verification.
                    <div className="flex items-center gap-2 mt-1 ml-5 font-mono bg-white px-3 py-1.5 rounded border border-blue-200 w-fit">
                        <Mail className="w-3 h-3" />
                        <span>admin@ordernow.com</span>
                    </div>
                </li>
                <li>
                    <strong>Wait for Approval:</strong> Once approved, you will receive a notification email.
                </li>
                <li>
                    <strong>Connect Stripe:</strong> After approval, log in and go to <span className="font-semibold">Settings &gt; Configuration</span> to verify your bank details for payouts.
                </li>
            </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link to="/guide" className="btn-secondary flex items-center justify-center gap-2">
                <PlayCircle className="w-4 h-4" /> Watch Onboarding Guide
            </Link>
             <Link to="/" className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary/30">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;