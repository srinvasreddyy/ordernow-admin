import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  UserPlus, Phone, Truck, CircleDot, Trash2, Edit2, 
  User, Search, Star, Package, Key, MapPin, AlertCircle 
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Fleet() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');

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
      toast.success("Driver registered successfully");
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add driver")
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Clean up empty password if not changing
      if (!data.password) delete data.password;
      return api.put(`/owner/delivery-partners/${editingDriver._id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveryPartners']);
      toast.success("Driver updated successfully");
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update driver")
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/owner/delivery-partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveryPartners']);
      toast.success("Driver removed");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete driver")
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
      username: '',
      password: '',
      phoneNumber: '',
      deliveryPartnerProfile: { vehicleType: 'Bike', vehicleNumber: '' }
    });
    setIsModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    reset({
      fullName: driver.fullName,
      username: driver.username,
      password: '', // Reset password field for edit
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

  // Filter Logic
  const filteredPartners = partners?.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Fleet Management</h1>
          <p className="text-secondary text-sm">Track and manage your delivery partners.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> Add New Driver
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          className="input-field pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"/>)}
        </div>
      ) : !filteredPartners?.length ? (
        <div className="card-base p-16 text-center flex flex-col items-center justify-center text-secondary border-dashed">
            <User className="w-12 h-12 text-gray-300 mb-2" />
            <p>No drivers found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => {
            // Determine Status
            const isOnline = partner.deliveryPartnerProfile?.isAvailable;
            // Assuming backend populates currentOrder. If not, this block handles graceful fallback.
            const currentOrder = partner.currentOrder; 
            const status = currentOrder ? 'On Delivery' : (isOnline ? 'Available' : 'Offline');
            
            const statusColors = {
                'Available': 'bg-green-100 text-green-700',
                'Offline': 'bg-gray-100 text-gray-600',
                'On Delivery': 'bg-blue-100 text-blue-700'
            };

            return (
              <div key={partner._id} className="card-base p-5 flex flex-col gap-4 relative group hover:shadow-lg transition-all border border-transparent hover:border-primary/20">
                
                {/* Action Buttons (Hover) */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(partner)}
                    className="p-2 bg-white text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg shadow-sm border border-gray-100 transition-all"
                    title="Edit Details & Password"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { 
                        if(window.confirm(`Are you sure you want to remove ${partner.fullName}?`)) {
                            deleteMutation.mutate(partner._id);
                        }
                    }} 
                    className="p-2 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg shadow-sm border border-gray-100 transition-all"
                    title="Delete Driver"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Profile Header */}
                <div className="flex justify-between items-start pr-16">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md",
                        status === 'On Delivery' ? "bg-blue-500" : (isOnline ? "bg-green-500" : "bg-gray-400")
                    )}>
                      {partner.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-dark text-lg leading-tight">{partner.fullName}</h3>
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide",
                        statusColors[status]
                      )}>
                        <CircleDot className={clsx("w-2 h-2 fill-current", status === 'On Delivery' && "animate-pulse")} />
                        {status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Delivery Banner */}
                {currentOrder && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3 text-sm text-blue-800">
                        <div className="p-1.5 bg-blue-100 rounded-full shrink-0">
                            <Truck className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase text-blue-500">Current Task</span>
                            <span className="font-semibold">Order #{currentOrder.orderNumber?.slice(-6) || 'Unknown'}</span>
                        </div>
                    </div>
                )}

                {/* Details Grid */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-secondary">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>@{partner.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{partner.phoneNumber}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                     <div className="flex items-center gap-2" title="Vehicle">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-dark">{partner.deliveryPartnerProfile?.vehicleType}</span>
                        <span className="text-[10px] bg-white border border-gray-200 px-1.5 rounded text-gray-500">
                            {partner.deliveryPartnerProfile?.vehicleNumber}
                        </span>
                     </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center bg-yellow-50 p-2 rounded-xl border border-yellow-100">
                        <div className="flex items-center gap-1 text-yellow-700 font-bold">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            {partner.deliveryPartnerProfile?.rating?.toFixed(1) || '0.0'}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-yellow-600">Rating</span>
                    </div>
                    <div className="flex flex-col items-center bg-purple-50 p-2 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-1 text-purple-700 font-bold">
                            <Package className="w-4 h-4" />
                            {partner.deliveryPartnerProfile?.totalDeliveries || 0}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-purple-600">Completed</span>
                    </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-dark mb-6 border-b border-gray-100 pb-4">
              {editingDriver ? 'Edit Driver Details' : 'Register New Driver'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Personal Info */}
              <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="input-label">Full Name</label>
                        <input {...register('fullName', { required: true })} className="input-field" placeholder="e.g. John Doe" />
                    </div>
                    <div className="col-span-2">
                        <label className="input-label">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input {...register('phoneNumber', { required: true })} className="input-field pl-9" placeholder="+91 9876543210" />
                        </div>
                    </div>
                  </div>
              </div>

              {/* Login Credentials & Security */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-3 h-3" /> Credentials & Security
                  </h3>
                  
                  <div>
                    <label className="input-label">Username</label>
                    <input 
                      type="text" 
                      {...register('username', { required: true })} 
                      className={clsx(
                        "input-field",
                        editingDriver && "bg-gray-200 text-gray-500 cursor-not-allowed border-transparent focus:ring-0"
                      )}
                      readOnly={!!editingDriver} 
                      placeholder="Unique username for login"
                    />
                  </div>

                  <div>
                    <label className="input-label">
                        {editingDriver ? 'New Password' : 'Password'}
                    </label>
                    <input 
                        type="password"
                        {...register('password', { required: !editingDriver, minLength: 6 })} 
                        className="input-field border-orange-200 focus:border-orange-500 focus:ring-orange-200"
                        placeholder={editingDriver ? "Leave blank to keep current password" : "Set initial password"}
                    />
                    {editingDriver && (
                        <p className="text-[10px] text-orange-600 mt-1 font-medium">
                            * Enter a value here to override the driver's current password.
                        </p>
                    )}
                  </div>
              </div>
              
              {/* Vehicle Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="input-label">Type</label>
                        <select {...register('deliveryPartnerProfile.vehicleType')} className="input-field">
                            <option value="Bike">Bike</option>
                            <option value="Scooter">Scooter</option>
                            <option value="Car">Car</option>
                            <option value="Bicycle">Bicycle</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Plate Number</label>
                        <input {...register('deliveryPartnerProfile.vehicleNumber')} className="input-field" placeholder="XX-00-XX-0000" />
                    </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-32 justify-center">
                    {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (editingDriver ? 'Update' : 'Register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}