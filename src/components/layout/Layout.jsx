import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, UtensilsCrossed, 
  Armchair, Megaphone, Users, Settings, 
  LogOut, Store, WifiOff, X, BarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';
import Header from './Header';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Performance', href: '/performance', icon: BarChart2 }, // Added from previous context
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { name: 'Tables', href: '/tables', icon: Armchair },
  { name: 'Reservations', href: '/bookings', icon: Users },
  { name: 'Marketing', href: '/marketing', icon: Megaphone },
  { name: 'Fleet', href: '/fleet', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth(); // Destructure user here
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    const handleMockEvent = () => setIsMockMode(true);
    window.addEventListener('mock-mode-active', handleMockEvent);
    return () => window.removeEventListener('mock-mode-active', handleMockEvent);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // --- ROLE BASED FILTERING ---
  const filteredNavItems = NAV_ITEMS.filter(item => {
    // List of items that require 'food_delivery_and_dining' role
    const diningOnlyItems = ['Tables', 'Reservations'];
    
    if (diningOnlyItems.includes(item.name)) {
      return user?.restaurantType === 'food_delivery_and_dining';
    }
    
    return true;
  });

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center px-6 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/40 shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className={clsx("font-bold text-xl tracking-tight text-white transition-opacity duration-300", 
            !isSidebarOpen && "lg:opacity-0 lg:hidden"
          )}>
            Order<span className="text-primary">Now</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative mb-1",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/30 font-medium" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={clsx("w-5 h-5 shrink-0", isActive && "animate-pulse")} />
              <span className={clsx("whitespace-nowrap transition-all duration-300 text-sm", 
                !isSidebarOpen && "lg:hidden"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800/50">
        <button 
          onClick={logout}
          className="flex items-center gap-3 text-gray-400 hover:text-red-400 w-full px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
          <span className={clsx("font-medium text-sm", !isSidebarOpen && "lg:hidden")}>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-cream flex flex-col overflow-hidden">
      {isMockMode && (
        <div className="bg-red-600 text-white px-4 py-1 text-center text-xs font-bold flex items-center justify-center gap-2 z-50">
          <WifiOff className="w-3 h-3" />
          <span>OFFLINE MODE</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className={clsx(
          "hidden lg:flex flex-col bg-[#161C24] text-white transition-all duration-300 ease-in-out z-30 shadow-2xl",
          isSidebarOpen ? "w-[280px]" : "w-20"
        )}>
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <div className={clsx(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className={clsx(
            "absolute left-0 top-0 bottom-0 w-[280px] bg-[#161C24] text-white flex flex-col transform transition-transform duration-300",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-400">
              <X className="w-6 h-6" />
            </button>
            <SidebarContent />
          </aside>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-cream">
          <Header 
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
            toggleMobileMenu={() => setMobileOpen(true)}
            isSidebarOpen={isSidebarOpen} 
          />
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
            <div className="max-w-[1600px] mx-auto pb-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}