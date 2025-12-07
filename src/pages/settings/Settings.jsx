import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Save, Store, Settings as SettingsIcon } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Settings() {
  const { user } = useAuth(); // User contains restaurant info if populated correctly on login, but better to fetch fresh.
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile } = useForm();
  const { register: registerConfig, handleSubmit: handleConfigSubmit, reset: resetConfig } = useForm();

  // Fetch fresh restaurant data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get(`/restaurants/${user._id}`);
        const r = data.data;
        
        resetProfile({
          restaurantName: r.restaurantName,
          ownerFullName: r.ownerFullName,
          phoneNumber: r.phoneNumber,
          primaryContactName: r.primaryContactName,
          // Flatten address for easier form handling if needed, or keep nested
          // Using simplified approach for address here
        });

        resetConfig({
          handlingChargesPercentage: r.handlingChargesPercentage,
          freeDeliveryRadius: r.deliverySettings.freeDeliveryRadius,
          chargePerMile: r.deliverySettings.chargePerMile,
          maxDeliveryRadius: r.deliverySettings.maxDeliveryRadius,
          acceptsDining: r.acceptsDining,
          // acceptsCashOnDelivery: r.acceptsCashOnDelivery // Assuming this field exists in model
        });
        
        setIsLoading(false);
      } catch (error) {
        toast.error("Failed to load settings");
      }
    };
    if (user?._id) fetchSettings();
  }, [user?._id, resetProfile, resetConfig]);

  const onProfileSubmit = async (data) => {
    try {
      await api.put('/restaurants/profile', data);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const onConfigSubmit = async (data) => {
    try {
      // Reconstruct nested object
      const payload = {
        handlingChargesPercentage: Number(data.handlingChargesPercentage),
        deliverySettings: {
          freeDeliveryRadius: Number(data.freeDeliveryRadius),
          chargePerMile: Number(data.chargePerMile),
          maxDeliveryRadius: Number(data.maxDeliveryRadius),
        },
        acceptsDining: data.acceptsDining,
        stripeSecretKey: data.stripeSecretKey || undefined // Only send if provided
      };
      
      await api.put('/restaurants/settings', payload);
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  if (isLoading) return <div className="p-10 text-center">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={clsx(
              "flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === 'profile' ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Store className="w-4 h-4" /> Profile Information
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={clsx(
              "flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === 'config' ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <SettingsIcon className="w-4 h-4" /> Configuration & Finance
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                  <input {...registerProfile('restaurantName')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                  <input {...registerProfile('ownerFullName')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input {...registerProfile('phoneNumber')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Contact</label>
                  <input {...registerProfile('primaryContactName')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfigSubmit(onConfigSubmit)} className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800 mb-6">
                <strong>Note:</strong> Adjusting these settings will affect how delivery fees are calculated for customers immediately.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Free Delivery Radius (miles)</label>
                  <input type="number" step="0.1" {...registerConfig('freeDeliveryRadius')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Charge Per Mile (£)</label>
                  <input type="number" step="0.01" {...registerConfig('chargePerMile')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Delivery Radius (miles)</label>
                  <input type="number" step="0.1" {...registerConfig('maxDeliveryRadius')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Handling Charges (%)</label>
                  <input type="number" step="0.01" {...registerConfig('handlingChargesPercentage')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Update Stripe Secret Key</label>
                  <input type="password" {...registerConfig('stripeSecretKey')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Leave empty to keep unchanged" />
                </div>
                
                <div className="col-span-2 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Operational Features</h4>
                    <label className="flex items-center gap-3">
                        <input type="checkbox" {...registerConfig('acceptsDining')} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                        <span className="text-gray-700">Enable Dine-in / Table Management</span>
                    </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}