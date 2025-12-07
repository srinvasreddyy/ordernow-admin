import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { UserPlus, Phone, Mail, Truck, CircleDot } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Fleet() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Delivery Partners
  const { data: partners, isLoading } = useQuery({
    queryKey: ['deliveryPartners'],
    queryFn: async () => {
      const { data } = await api.get('/owner/delivery-partners');
      return data.data;
    }
  });

  // Create Partner Mutation
  const mutation = useMutation({
    mutationFn: async (data) => api.post('/owner/delivery-partners', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveryPartners']);
      toast.success("Delivery partner added successfully");
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add partner")
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const onSubmit = (data) => mutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Fleet</h1>
          <p className="text-gray-500 text-sm">Manage your internal delivery team</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5" /> Add Partner
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading fleet...</div>
      ) : partners?.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-dashed">
          No delivery partners found. Add your first driver.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <div key={partner._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {partner.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{partner.fullName}</h3>
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full mt-1",
                      partner.deliveryPartnerProfile?.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    )}>
                      <CircleDot className="w-2 h-2 fill-current" />
                      {partner.deliveryPartnerProfile?.isAvailable ? 'Available' : 'Offline/Busy'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {partner.email}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {partner.phoneNumber}
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-gray-400" />
                  {partner.deliveryPartnerProfile?.vehicleType || 'Not specified'} ({partner.deliveryPartnerProfile?.vehicleNumber || 'N/A'})
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Register Delivery Partner</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input {...register('fullName', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" {...register('email', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input {...register('phoneNumber', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="+44..." />
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Vehicle Details</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Type</label>
                        <select {...register('deliveryPartnerProfile.vehicleType')} className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm">
                            <option value="Bike">Bike</option>
                            <option value="Scooter">Scooter</option>
                            <option value="Car">Car</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Vehicle No.</label>
                        <input {...register('deliveryPartnerProfile.vehicleNumber')} className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
                    </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {isSubmitting ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}