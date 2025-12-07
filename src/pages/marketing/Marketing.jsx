import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Megaphone, Image as ImageIcon, Tag, Trash2, Eye, ThumbsUp, Heart, Smile } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Marketing() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  
  // -- Fetch Data --
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements/owner/all');
      return data.data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['announcementStats'],
    queryFn: async () => {
      const { data } = await api.get('/announcements/stats');
      return data.data;
    }
  });

  // -- Mutations --
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success("Announcement deleted");
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (id) => api.patch(`/announcements/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success("Status updated");
    }
  });

  // -- Form Logic --
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const announcementType = watch('announcementType', 'text');

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('announcementType', data.announcementType);

      if (data.announcementType === 'image' && data.image?.[0]) {
        formData.append('image', data.image[0]);
      }

      if (data.announcementType === 'offer') {
        const offerDetails = {
          promoCode: data.promoCode,
          discountType: data.discountType,
          discountValue: Number(data.discountValue),
          minOrderValue: Number(data.minOrderValue),
          validUntil: data.validUntil
        };
        formData.append('offerDetails', JSON.stringify(offerDetails));
      }

      await api.post('/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Campaign created successfully!");
      reset();
      setActiveTab('list');
      queryClient.invalidateQueries(['announcements']);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create campaign");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing & Offers</h1>
          <p className="text-gray-500 text-sm">Engage customers with announcements and promo codes</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('list')}
            className={clsx("px-4 py-2 text-sm font-medium rounded-md transition-all", activeTab === 'list' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900")}
          >
            Active Campaigns
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={clsx("px-4 py-2 text-sm font-medium rounded-md transition-all", activeTab === 'create' ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-900")}
          >
            Create New
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <h3 className="text-indigo-600 text-xs font-bold uppercase tracking-wider">Total Reactions</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalReactions || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <h3 className="text-green-600 text-xs font-bold uppercase tracking-wider">Last 24h Activity</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.reactionsInLast24h || 0}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
          <h3 className="text-orange-600 text-xs font-bold uppercase tracking-wider">Trend</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.percentageChangeInLast24h || 0}%</p>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'list' ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10">Loading campaigns...</div>
          ) : announcements?.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">
              No active announcements. Create one to boost sales!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map((item) => (
                <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  {item.imageUrl && (
                    <div className="h-40 w-full bg-gray-100">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            {item.announcementType === 'offer' ? <Tag className="w-4 h-4 text-green-600" /> : <Megaphone className="w-4 h-4 text-indigo-600" />}
                            <span className="text-xs font-bold uppercase text-gray-500">{item.announcementType}</span>
                        </div>
                        <span className={clsx("w-2 h-2 rounded-full", item.isActive ? "bg-green-500" : "bg-red-500")} />
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 flex-1">{item.content}</p>

                    {item.offerDetails && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-green-700 font-medium">CODE:</span>
                                <span className="font-mono font-bold text-green-800 bg-green-200 px-2 rounded">{item.offerDetails.promoCode}</span>
                            </div>
                            <div className="text-xs text-green-700">
                                {item.offerDetails.discountType === 'PERCENTAGE' ? `${item.offerDetails.discountValue}% OFF` : `£${item.offerDetails.discountValue} OFF`}
                                <span className="mx-1">•</span>
                                Min Order: £{item.offerDetails.minOrderValue}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4"/> {item.reactionCount}</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => toggleMutation.mutate(item._id)}
                                className="text-xs font-medium px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
                            >
                                {item.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                                onClick={() => { if(window.confirm('Delete campaign?')) deleteMutation.mutate(item._id) }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // CREATE FORM
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
              <input {...register('title', { required: true })} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Weekend Madness" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content / Description</label>
              <textarea {...register('content', { required: true })} rows={3} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe your announcement..." />
            </div>

            <div className="grid grid-cols-3 gap-4">
               {['text', 'image', 'offer'].map(type => (
                   <label key={type} className={clsx(
                       "flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all",
                       announcementType === type ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 hover:border-indigo-200 text-gray-500"
                   )}>
                       <input type="radio" value={type} {...register('announcementType')} className="sr-only" />
                       {type === 'text' && <Megaphone className="w-6 h-6 mb-2" />}
                       {type === 'image' && <ImageIcon className="w-6 h-6 mb-2" />}
                       {type === 'offer' && <Tag className="w-6 h-6 mb-2" />}
                       <span className="capitalize font-medium text-sm">{type}</span>
                   </label>
               ))}
            </div>

            {announcementType === 'image' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Banner</label>
                    <input type="file" {...register('image', { required: true })} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
            )}

            {announcementType === 'offer' && (
                <div className="bg-gray-50 p-5 rounded-xl space-y-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900">Offer Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Promo Code</label>
                            <input {...register('promoCode', { required: true })} className="w-full border-gray-300 rounded-md shadow-sm uppercase font-mono" placeholder="SAVE20" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Valid Until</label>
                            <input type="date" {...register('validUntil', { required: true })} className="w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Discount Type</label>
                            <select {...register('discountType')} className="w-full border-gray-300 rounded-md shadow-sm">
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FLAT">Flat Amount (£)</option>
                                <option value="FREE_DELIVERY">Free Delivery</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Value</label>
                            <input type="number" {...register('discountValue', { required: true })} className="w-full border-gray-300 rounded-md shadow-sm" placeholder="20" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Min Order Value (£)</label>
                            <input type="number" {...register('minOrderValue', { required: true })} className="w-full border-gray-300 rounded-md shadow-sm" placeholder="15" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm disabled:bg-gray-400"
                >
                    {isSubmitting ? 'Creating...' : 'Launch Campaign'}
                </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}