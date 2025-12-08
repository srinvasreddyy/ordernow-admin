import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Save, Store, Settings as SettingsIcon } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile } = useForm();
  const { register: registerConfig, handleSubmit: handleConfigSubmit, reset: resetConfig } = useForm();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // FIX: Changed from `/restaurants/${user._id}` to `/restaurants/me`
        const { data } = await api.get('/restaurants/me');
        const r = data.data;
        
        resetProfile({
          restaurantName: r.restaurantName,
          ownerFullName: r.ownerFullName,
          phoneNumber: r.phoneNumber,
          primaryContactName: r.primaryContactName,
        });
        
        resetConfig({
          handlingChargesPercentage: r.handlingChargesPercentage,
          freeDeliveryRadius: r.deliverySettings?.freeDeliveryRadius,
          chargePerMile: r.deliverySettings?.chargePerMile,
          maxDeliveryRadius: r.deliverySettings?.maxDeliveryRadius,
          acceptsDining: r.acceptsDining,
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to load settings");
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have a user, though /me relies on the cookie/token essentially
    if (user) fetchSettings();
  }, [user, resetProfile, resetConfig]);

  const onProfileSubmit = async (data) => {
    try {
      await api.put('/restaurants/profile', data);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const onConfigSubmit = async (data) => {
    try {
      const payload = {
        handlingChargesPercentage: Number(data.handlingChargesPercentage),
        deliverySettings: {
          freeDeliveryRadius: Number(data.freeDeliveryRadius),
          chargePerMile: Number(data.chargePerMile),
          maxDeliveryRadius: Number(data.maxDeliveryRadius),
        },
        acceptsDining: data.acceptsDining,
        stripeSecretKey: data.stripeSecretKey || undefined
      };
      await api.put('/restaurants/settings', payload);
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  if (isLoading) return <div className="p-10 text-center text-secondary">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      <h1 className="text-2xl font-bold text-dark mb-6">Settings</h1>

      <div className="card-base overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('profile')}
            className={clsx(
              "flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2",
              activeTab === 'profile' ? "text-primary border-primary bg-white" : "text-secondary border-transparent hover:text-dark hover:bg-gray-50"
            )}
          >
            <Store className="w-4 h-4" /> Profile Information
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={clsx(
              "flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2",
              activeTab === 'config' ? "text-primary border-primary bg-white" : "text-secondary border-transparent hover:text-dark hover:bg-gray-50"
            )}
          >
            <SettingsIcon className="w-4 h-4" /> Configuration & Finance
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Restaurant Name</label>
                  <input {...registerProfile('restaurantName')} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Owner Name</label>
                  <input {...registerProfile('ownerFullName')} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Phone Number</label>
                  <input {...registerProfile('phoneNumber')} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Primary Contact</label>
                  <input {...registerProfile('primaryContactName')} className="input-field" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="btn-primary">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfigSubmit(onConfigSubmit)} className="space-y-6">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-800 mb-6 flex gap-3">
                <div className="w-1 bg-orange-400 rounded-full"></div>
                <div>
                    <strong>Important:</strong> Changes here affect live delivery calculations immediately.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Free Delivery Radius (miles)</label>
                  <input type="number" step="0.1" {...registerConfig('freeDeliveryRadius')} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Charge Per Mile (£)</label>
                  <input type="number" step="0.01" {...registerConfig('chargePerMile')} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Max Delivery Radius (miles)</label>
                  <input type="number" step="0.1" {...registerConfig('maxDeliveryRadius')} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Handling Charges (%)</label>
                  <input type="number" step="0.01" {...registerConfig('handlingChargesPercentage')} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="input-label">Stripe Secret Key</label>
                  <input type="password" {...registerConfig('stripeSecretKey')} className="input-field" placeholder="••••••••••••••••" />
                </div>
                
                {/* Only show Table Management toggle for Dining Restaurants */}
                {user?.restaurantType === 'food_delivery_and_dining' && (
                  <div className="col-span-2 border-t border-gray-100 pt-6">
                      <h4 className="text-sm font-bold text-dark mb-4">Operational Features</h4>
                      <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-primary/50 transition-colors cursor-pointer">
                          <input type="checkbox" {...registerConfig('acceptsDining')} className="rounded text-primary focus:ring-primary/25 w-5 h-5 border-gray-300" />
                          <div>
                              <span className="block text-sm font-bold text-dark">Enable Table Management</span>
                              <span className="block text-xs text-secondary">Allow dining in and table reservations.</span>
                          </div>
                      </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="btn-primary">
                  <Save className="w-4 h-4" /> Update Configuration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}