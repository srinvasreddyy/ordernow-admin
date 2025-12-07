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

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems', user?._id],
    queryFn: async () => {
      const { data } = await api.get(`/menuItems/restaurant/${user._id}?limit=100`);
      return data.data;
    },
    enabled: !!user?._id
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, currentStatus }) => {
      const { data } = await api.put(`/menuItems/${id}`, { isAvailable: !currentStatus });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['menuItems']);
      toast.success("Updated availability");
    },
    onError: () => toast.error("Failed to update")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/menuItems/${id}`),
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Menu</h1>
          <p className="text-gray-500 text-sm">Manage your catalog</p>
        </div>
        <Link to="/menu/add" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Item
        </Link>
      </div>

      <div className="card-base p-2 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search items..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm pl-9"
          />
        </div>
        <div className="h-px w-full sm:w-px sm:h-auto bg-gray-200" />
        <div className="flex items-center gap-2 px-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 cursor-pointer"
            >
                <option value="all">All Items</option>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
                <option value="egg">Egg</option>
            </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"/>)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card-base p-12 text-center text-gray-400">
            <Utensils className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <div 
                key={item._id} 
                className="card-base group flex flex-col hover:shadow-md transition-shadow duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {item.displayImageUrl ? (
                    <img src={item.displayImageUrl} alt={item.itemName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Utensils className="w-12 h-12" />
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <span className={clsx(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase shadow-sm bg-white/90 backdrop-blur",
                        item.itemType === 'veg' ? 'text-green-700' : 'text-red-700'
                    )}>
                        {item.itemType}
                    </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-dark text-lg line-clamp-1">{item.itemName}</h3>
                    <span className="font-bold text-primary">£{item.basePrice}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => toggleMutation.mutate({ id: item._id, currentStatus: item.isAvailable })}
                        className={clsx(
                            "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors",
                            item.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}
                    >
                        <Power className="w-3 h-3" />
                        {item.isAvailable ? 'Active' : 'Hidden'}
                    </button>
                    
                    <div className="flex gap-1">
                        <Link to={`/menu/edit/${item._id}`} className="p-2 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                            onClick={() => { if(window.confirm('Delete item?')) deleteMutation.mutate(item._id) }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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