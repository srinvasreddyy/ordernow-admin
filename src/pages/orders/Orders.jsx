import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ChefHat, Truck, CheckCircle2, AlertCircle, Inbox, XCircle } from 'lucide-react';
import api from '../../api/axios';
import OrderCard from './components/OrderCard';
import AssignDriverModal from './components/AssignDriverModal';
import clsx from 'clsx';

// UPDATED TABS: Added 'Cancelled' tab and cleaned up 'Completed'
const TABS = [
  { 
      id: 'new', 
      label: 'New', 
      icon: AlertCircle, 
      status: 'placed', 
      acceptanceStatus: 'pending' 
  },
  { 
      id: 'preparing', 
      label: 'Preparing', 
      icon: ChefHat, 
      status: 'preparing,ready_for_pickup', // Fetches both statuses
      acceptanceStatus: 'accepted' 
  },
  { 
      id: 'out_for_delivery', 
      label: 'Delivery', 
      icon: Truck, 
      status: 'out_for_delivery', 
      acceptanceStatus: 'accepted' 
  },
  { 
      id: 'past', 
      label: 'Completed', 
      icon: CheckCircle2, 
      status: 'delivered', // Only show successfully delivered orders here
      acceptanceStatus: 'accepted' 
  },
  { 
      id: 'cancelled', 
      label: 'Cancelled', 
      icon: XCircle, 
      status: 'cancelled,refunded,rejected', // Catch all failed/rejected orders
      // Note: We intentionally omit acceptanceStatus here to fetch both 
      // rejected orders (acceptanceStatus: rejected) and 
      // cancelled orders (acceptanceStatus: accepted/pending but status: cancelled)
  },
];

export default function Orders() {
  const [activeTab, setActiveTab] = useState('new');
  const [selectedOrderForDriver, setSelectedOrderForDriver] = useState(null);

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: async () => {
      const currentTab = TABS.find(t => t.id === activeTab);
      const params = { limit: 50 };
      
      // Use the statuses defined in the TABS object
      if (currentTab.status) params.status = currentTab.status;
      if (currentTab.acceptanceStatus) params.acceptanceStatus = currentTab.acceptanceStatus;
      
      const endpoint = activeTab === 'new' ? '/orders/restaurant/new' : '/orders/restaurant';
      const { data } = await api.get(endpoint, { params });
      return data.data;
    },
    refetchInterval: activeTab === 'new' ? 15000 : false,
  });

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Orders</h1>
        <button 
          onClick={() => refetch()} 
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-secondary transition-all"
        >
          <RefreshCw className={clsx("w-5 h-5", isRefetching && "animate-spin text-primary")} />
        </button>
      </div>

      <div className="card-base p-1.5 flex shrink-0 gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex-1 whitespace-nowrap",
              activeTab === tab.id ? "bg-primary text-white shadow-md" : "text-secondary hover:bg-gray-50 hover:text-dark"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-secondary">Loading orders...</div>
        ) : !orders?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-secondary animate-scale-in">
            <Inbox className="w-12 h-12 text-gray-300 mb-2" />
            <p>No orders in this stage</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-10">
            {orders.map((order, i) => (
              <div key={order._id} style={{ animationDelay: `${i * 50}ms` }} className="animate-slide-up">
                <OrderCard order={order} activeTab={activeTab} onAssignDriver={() => setSelectedOrderForDriver(order)} refetch={refetch} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrderForDriver && (
        <AssignDriverModal order={selectedOrderForDriver} onClose={() => setSelectedOrderForDriver(null)} onSuccess={() => { setSelectedOrderForDriver(null); refetch(); }} />
      )}
    </div>
  );
}