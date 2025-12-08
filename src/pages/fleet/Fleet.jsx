import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { UserPlus, Phone, Mail, Truck, CircleDot, Trash2, Edit2 } from 'lucide-react'; // Added Edit2 icon
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Fleet() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null); // Track which driver is being edited

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const { data: partners, isLoading } = useQuery({
    queryKey: ['deliveryPartners'],
    queryFn: async () => {
      const { data } = await api.get('/owner/delivery-partners');
      return data.data;
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data) => api.post('/owner/delivery-partners', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveryPartners']);
      toast.success("Added successfully");
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add")
  });

  // Update Mutation (New)
  const updateMutation = useMutation({
    mutationFn: async (data) => api.put(`/owner/delivery-partners/${editingDriver._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveryPartners']);
      toast.success("Updated successfully");
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update")
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/owner/delivery-partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveryPartners']);
      toast.success("Driver deleted");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete")
  });

  const onSubmit = (data) => {
    if (editingDriver) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const openAddModal = () => {
    setEditingDriver(null);
    reset({
      fullName: '',
      email: '',
      phoneNumber: '',
      deliveryPartnerProfile: { vehicleType: 'Bike', vehicleNumber: '' }
    });
    setIsModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    reset({
      fullName: driver.fullName,
      email: driver.email,
      phoneNumber: driver.phoneNumber,
      deliveryPartnerProfile: {
        vehicleType: driver.deliveryPartnerProfile?.vehicleType || 'Bike',
        vehicleNumber: driver.deliveryPartnerProfile?.vehicleNumber || ''
      }
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
    reset();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark">Fleet Management</h1>
          <p className="text-secondary text-sm">Manage your delivery drivers.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <UserPlus className="w-5 h-5" /> Add Driver
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"/>)}
        </div>
      ) : !partners?.length ? (
        <div className="card-base p-16 text-center text-secondary border-dashed">No drivers found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <div key={partner._id} className="card-base p-6 flex flex-col gap-4 relative group">
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(partner)}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-all"
                  title="Edit Driver"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { 
                      if(window.confirm(`Are you sure you want to remove ${partner.fullName}? This cannot be undone.`)) {
                          deleteMutation.mutate(partner._id);
                      }
                  }} 
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete Driver"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-primary font-bold text-lg">
                    {partner.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-dark text-lg">{partner.fullName}</h3>
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide",
                      partner.deliveryPartnerProfile?.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    )}>
                      <CircleDot className="w-2 h-2 fill-current" />
                      {partner.deliveryPartnerProfile?.isAvailable ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-secondary bg-gray-50 p-4 rounded-xl border border-gray-100">
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
                  <span className="font-medium text-dark">{partner.deliveryPartnerProfile?.vehicleType || 'Not specified'}</span>
                  <span className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">{partner.deliveryPartnerProfile?.vehicleNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-dark mb-6">
              {editingDriver ? 'Edit Driver' : 'Register Driver'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="input-label">Full Name</label>
                <input {...register('fullName', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input 
                  type="email" 
                  {...register('email', { required: true })} 
                  className={clsx(
                    "input-field",
                    editingDriver && "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200 focus:ring-0"
                  )}
                  readOnly={!!editingDriver} // Prevent typing
                  title={editingDriver ? "Email cannot be changed" : ""}
                />
                {editingDriver && <p className="text-xs text-secondary mt-1">Email cannot be changed.</p>}
              </div>
              <div>
                <label className="input-label">Phone Number</label>
                <input {...register('phoneNumber', { required: true })} className="input-field" />
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-sm font-bold text-dark mb-3">Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="input-label">Type</label>
                        <select {...register('deliveryPartnerProfile.vehicleType')} className="input-field">
                            <option value="Bike">Bike</option>
                            <option value="Scooter">Scooter</option>
                            <option value="Car">Car</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Plate No.</label>
                        <input {...register('deliveryPartnerProfile.vehicleNumber')} className="input-field" />
                    </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? 'Saving...' : (editingDriver ? 'Update' : 'Register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}