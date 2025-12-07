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
    <header className="h-20 bg-cream/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 border-b border-beige">
      <div className="flex items-center gap-4">
        {/* Desktop Toggle */}
        <button 
          onClick={toggleSidebar} 
          className="hidden lg:flex p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-primary transition-colors border border-gray-100"
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        
        {/* Mobile Toggle */}
        <button 
          onClick={toggleMobileMenu} 
          className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div>
          <h2 className="text-lg md:text-xl font-bold text-dark leading-tight">
            Hi, {user?.ownerFullName?.split(' ')[0]}
          </h2>
          <p className="text-xs text-gray-500 hidden md:block">Let's make today productive.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Status Toggle - Compact on Mobile */}
        <button
          onClick={() => toggleStatusMutation.mutate()}
          disabled={isToggling}
          className={`
            flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-all duration-300
            ${user?.isActive ? 'bg-green-100/50 border-green-200' : 'bg-gray-100 border-gray-200'}
          `}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${user?.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className={`text-xs font-bold ${user?.isActive ? 'text-green-700' : 'text-gray-500'}`}>
            {user?.isActive ? 'OPEN' : 'CLOSED'}
          </span>
        </button>

        <button className="relative p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-primary transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 p-0.5 shadow-md">
            {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover rounded-[10px]" />
            ) : (
                <div className="w-full h-full bg-white flex items-center justify-center text-primary font-bold rounded-[10px] text-sm">
                    {user?.restaurantName?.charAt(0)}
                </div>
            )}
        </div>
      </div>
    </header>
  );
}