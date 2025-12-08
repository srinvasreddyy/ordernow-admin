import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Megaphone, Image as ImageIcon, Tag, Trash2, Eye, ThumbsUp, Heart, Smile } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Marketing() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('list');
  
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

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success("Deleted");
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (id) => api.patch(`/announcements/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success("Status updated");
    }
  });

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const announcementType = watch('announcementType', 'text');

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('announcementType', data.announcementType);
      if (data.announcementType === 'image' && data.image?.[0]) formData.append('image', data.image[0]);
      if (data.announcementType === 'offer') {
        formData.append('offerDetails', JSON.stringify({
          promoCode: data.promoCode,
          discountType: data.discountType,
          discountValue: Number(data.discountValue),
          minOrderValue: Number(data.minOrderValue),
          validUntil: data.validUntil
        }));
      }
      await api.post('/announcements', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success("Campaign created!");
      reset();
      setActiveTab('list');
      queryClient.invalidateQueries(['announcements']);
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-dark">Marketing</h1>
          <p className="text-secondary text-sm">Boost sales with offers and news.</p>
        </div>
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
          <button onClick={() => setActiveTab('list')} className={clsx("px-4 py-2 text-sm font-semibold rounded-lg transition-all", activeTab === 'list' ? "bg-dark text-white shadow" : "text-secondary hover:text-dark")}>Active Campaigns</button>
          <button onClick={() => setActiveTab('create')} className={clsx("px-4 py-2 text-sm font-semibold rounded-lg transition-all", activeTab === 'create' ? "bg-primary text-white shadow" : "text-secondary hover:text-dark")}>Create New</button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-base p-5 border-l-4 border-l-indigo-500">
          <h3 className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Total Reactions</h3>
          <p className="text-2xl font-bold text-dark">{stats?.totalReactions || 0}</p>
        </div>
        <div className="card-base p-5 border-l-4 border-l-green-500">
          <h3 className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Last 24h Activity</h3>
          <p className="text-2xl font-bold text-dark">{stats?.reactionsInLast24h || 0}</p>
        </div>
        <div className="card-base p-5 border-l-4 border-l-orange-500">
          <h3 className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Trend</h3>
          <p className="text-2xl font-bold text-dark">{stats?.percentageChangeInLast24h || 0}%</p>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'list' ? (
        isLoading ? <div className="p-10 text-center text-secondary">Loading...</div> : !announcements?.length ? (
            <div className="card-base p-16 text-center text-secondary border-dashed">No active campaigns.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map((item) => (
                <div key={item._id} className="card-base flex flex-col group hover:shadow-lg transition-all">
                  {item.imageUrl && (
                    <div className="h-40 w-full bg-gray-100 overflow-hidden">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 text-xs font-bold uppercase text-secondary">
                            {item.announcementType === 'offer' ? <Tag className="w-3 h-3" /> : <Megaphone className="w-3 h-3" />}
                            {item.announcementType}
                        </span>
                        <span className={clsx("w-2 h-2 rounded-full", item.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500")} />
                    </div>
                    
                    <h3 className="text-lg font-bold text-dark mb-1">{item.title}</h3>
                    <p className="text-sm text-secondary mb-4 flex-1">{item.content}</p>

                    {item.offerDetails && (
                        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 mb-4 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-green-700 font-bold uppercase">Code</span>
                                <span className="font-mono font-bold text-green-800 bg-white px-2 py-0.5 rounded border border-green-200 shadow-sm">{item.offerDetails.promoCode}</span>
                            </div>
                            <div className="text-sm font-medium text-green-800 mt-1">
                                {item.offerDetails.discountType === 'PERCENTAGE' ? `${item.offerDetails.discountValue}% OFF` : `£${item.offerDetails.discountValue} OFF`}
                                <span className="text-green-600 text-xs font-normal ml-2">(Min: £{item.offerDetails.minOrderValue})</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                        <span className="flex items-center gap-1 text-sm font-medium text-secondary"><ThumbsUp className="w-4 h-4"/> {item.reactionCount}</span>
                        <div className="flex gap-2">
                            <button onClick={() => toggleMutation.mutate(item._id)} className="text-xs font-bold px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-secondary transition-colors">
                                {item.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => { if(window.confirm('Delete campaign?')) deleteMutation.mutate(item._id) }} className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      ) : (
        <div className="card-base p-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="input-label">Campaign Title</label>
              <input {...register('title', { required: true })} className="input-field" placeholder="e.g. Weekend Madness" />
            </div>
            <div>
              <label className="input-label">Description</label>
              <textarea {...register('content', { required: true })} rows={3} className="input-field" placeholder="Describe your announcement..." />
            </div>

            <div className="grid grid-cols-3 gap-4">
               {['text', 'image', 'offer'].map(type => (
                   <label key={type} className={clsx(
                       "flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all",
                       announcementType === type ? "border-primary bg-orange-50 text-primary" : "border-gray-200 hover:border-gray-300 text-secondary"
                   )}>
                       <input type="radio" value={type} {...register('announcementType')} className="sr-only" />
                       <span className="capitalize font-bold text-sm">{type}</span>
                   </label>
               ))}
            </div>

            {announcementType === 'image' && (
                <div>
                    <label className="input-label">Upload Banner</label>
                    <input type="file" {...register('image', { required: true })} accept="image/*" className="input-field pt-2" />
                </div>
            )}

            {announcementType === 'offer' && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                    <h4 className="font-bold text-dark text-sm uppercase tracking-wide">Offer Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="input-label">Promo Code</label>
                            <input {...register('promoCode', { required: true })} className="input-field uppercase font-mono" placeholder="SAVE20" />
                        </div>
                        <div>
                            <label className="input-label">Valid Until</label>
                            <input type="date" {...register('validUntil', { required: true })} className="input-field" />
                        </div>
                        <div>
                            <label className="input-label">Discount Type</label>
                            <select {...register('discountType')} className="input-field">
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FLAT">Flat Amount (£)</option>
                                <option value="FREE_DELIVERY">Free Delivery</option>
                            </select>
                        </div>
                        <div>
                            <label className="input-label">Value</label>
                            <input type="number" {...register('discountValue', { required: true })} className="input-field" />
                        </div>
                        <div className="col-span-2">
                            <label className="input-label">Min Order Value (£)</label>
                            <input type="number" {...register('minOrderValue', { required: true })} className="input-field" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
                    {isSubmitting ? 'Creating...' : 'Launch Campaign'}
                </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}