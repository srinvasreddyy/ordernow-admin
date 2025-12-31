import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Truck, Star } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AssignDriverModal({ order, onClose, onSuccess }) {
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Delivery Partners
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['deliveryPartners'],
    queryFn: async () => {
      const { data } = await api.get('/owner/delivery-partners');
      return data.data;
    }
  });

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/orders/${order._id}/assign-delivery`, {
        deliveryPartnerId: selectedDriverId
      });
      toast.success('Driver assigned successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter drivers based on search and availability
  const filteredDrivers = drivers?.filter(driver => {
    const matchesSearch = driver.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                Assign Delivery Partner
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Select a driver for Order #{order.orderNumber}
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search driver by name..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Loading drivers...</div>
              ) : filteredDrivers.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No matching drivers found.</div>
              ) : (
                filteredDrivers.map((driver) => {
                  const isAvailable = driver.deliveryPartnerProfile?.isAvailable;
                  return (
                    <div
                      key={driver._id}
                      onClick={() => isAvailable && setSelectedDriverId(driver._id)}
                      className={clsx(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                        selectedDriverId === driver._id
                          ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                          : "border-gray-200 hover:border-indigo-300",
                        !isAvailable && "opacity-60 cursor-not-allowed bg-gray-50"
                      )}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{driver.fullName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            {driver.deliveryPartnerProfile?.rating || 'N/A'}
                          </span>
                          <span>•</span>
                          <span>{driver.deliveryPartnerProfile?.vehicleType || 'Unknown Vehicle'}</span>
                        </div>
                      </div>
                      <div>
                        {isAvailable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Busy / Offline
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              disabled={!selectedDriverId || isSubmitting}
              onClick={handleAssign}
              className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:bg-gray-400"
            >
              {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}