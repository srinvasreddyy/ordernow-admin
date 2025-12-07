import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function Header({ toggleSidebar, toggleMobileMenu, isSidebarOpen }) {
  const { user, login } = useAuth();
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/restaurants/toggle-status');
      return data.data;
    },
    onMutate: () => setIsToggling(true),
    onSuccess: (updatedRestaurant) => {
      toast.success(updatedRestaurant.isActive ? "Store is now OPEN" : "Store is now CLOSED");
      login({ ...user, isActive: updatedRestaurant.isActive });
      queryClient.invalidateQueries(['restaurantStats']);
    },
    onError: () => toast.error("Failed to update status"),
    onSettled: () => setIsToggling(false)
  });

  return (
    <header className="h-20 bg-surface sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Desktop Toggle */}
        <button 
          onClick={toggleSidebar} 
          className="hidden lg:flex p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        
        {/* Mobile Toggle */}
        <button 
          onClick={toggleMobileMenu} 
          className="lg:hidden p-2 text-dark hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-dark leading-none">
            Welcome back, {user?.ownerFullName?.split(' ')[0]}
          </h2>
          <span className="text-xs text-secondary mt-1">Here's what's happening today.</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status Toggle */}
        <button
          onClick={() => toggleStatusMutation.mutate()}
          disabled={isToggling}
          className={`
            flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-all duration-300
            ${user?.isActive ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}
          `}
        >
          <span className={`w-2 h-2 rounded-full ${user?.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className={`text-xs font-bold tracking-wide ${user?.isActive ? 'text-green-700' : 'text-gray-500'}`}>
            {user?.isActive ? 'OPEN FOR ORDERS' : 'STORE CLOSED'}
          </span>
        </button>

        <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-10 w-10 rounded-full bg-gray-200 p-0.5 ring-2 ring-gray-100 cursor-pointer overflow-hidden">
            {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold rounded-full text-sm">
                    {user?.restaurantName?.charAt(0)}
                </div>
            )}
        </div>
      </div>
    </header>
  );
}