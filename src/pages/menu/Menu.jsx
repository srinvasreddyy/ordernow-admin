import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Power, Utensils } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Menu() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  // FIX: Updated API endpoint to match backend route (/api/menu-items)
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems', user?._id],
    queryFn: async () => {
      const { data } = await api.get(`/menu-items/restaurant/${user._id}?limit=100`);
      return data.data;
    },
    enabled: !!user?._id
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, currentStatus }) => {
      // FIX: Updated endpoint
      const { data } = await api.put(`/menu-items/${id}`, { 
        isAvailable: (!currentStatus).toString() 
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['menuItems']);
      toast.success("Updated availability");
    },
    onError: () => toast.error("Failed to update")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/menu-items/${id}`), // FIX: Updated endpoint
    onSuccess: () => {
        queryClient.invalidateQueries(['menuItems']);
        toast.success("Item deleted");
    }
  });

  const filteredItems = menuItems?.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || item.itemType === filterType;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Menu Management</h1>
          <p className="text-secondary text-sm">Organize and manage your food catalog.</p>
        </div>
        <Link to="/menu/add" className="btn-primary text-sm shadow-md shadow-primary/20">
          <Plus className="w-4 h-4" /> Add New Item
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card-base p-2 flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by item name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm pl-9 placeholder:text-gray-400 h-10"
          />
        </div>
        <div className="h-px w-full sm:w-px sm:h-8 bg-gray-200" />
        <div className="flex items-center gap-2 px-2 w-full sm:w-auto">
            <Filter className="text-gray-400 w-4 h-4" />
            <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 text-dark cursor-pointer h-10"
            >
                <option value="all">All Types</option>
                <option value="veg">Veg Only</option>
                <option value="non-veg">Non-Veg Only</option>
                <option value="egg">Egg Only</option>
            </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse"/>)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card-base p-16 text-center text-secondary">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Utensils className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-dark">No Items Found</h3>
            <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <div 
                key={item._id} 
                className="card-base group flex flex-col hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {item.displayImageUrl ? (
                    <img src={item.displayImageUrl} alt={item.itemName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                        <Utensils className="w-12 h-12 opacity-50" />
                    </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase shadow-sm bg-white/95 backdrop-blur tracking-wide",
                        item.itemType === 'veg' ? 'text-green-700' : 'text-red-700'
                    )}>
                        {item.itemType}
                    </span>
                    {item.isBestseller && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase shadow-sm bg-orange-500 text-white tracking-wide">
                        Bestseller
                      </span>
                    )}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-dark text-lg line-clamp-1 group-hover:text-primary transition-colors">{item.itemName}</h3>
                    <span className="font-bold text-dark bg-gray-100 px-2 py-1 rounded-md text-sm">£{item.basePrice}</span>
                </div>
                <p className="text-sm text-secondary line-clamp-2 mb-6 flex-1">{item.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => toggleMutation.mutate({ id: item._id, currentStatus: item.isAvailable })}
                        className={clsx(
                            "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors",
                            item.isAvailable ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"
                        )}
                    >
                        <Power className="w-3 h-3" />
                        {item.isAvailable ? 'Active' : 'Hidden'}
                    </button>
                    
                    <div className="flex gap-2">
                        <Link to={`/menu/edit/${item._id}`} className="p-2 text-secondary hover:text-primary hover:bg-orange-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                            onClick={() => { if(window.confirm('Delete item?')) deleteMutation.mutate(item._id) }}
                            className="p-2 text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
  );
}