import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ChefHat, Truck, CheckCircle2, AlertCircle, Inbox } from 'lucide-react';
import api from '../../api/axios';
import OrderCard from './components/OrderCard';
import AssignDriverModal from './components/AssignDriverModal';
import clsx from 'clsx';

const TABS = [
  { id: 'new', label: 'New', icon: AlertCircle, status: 'placed', acceptanceStatus: 'pending' },
  { id: 'preparing', label: 'Preparing', icon: ChefHat, status: 'placed', acceptanceStatus: 'accepted' },
  { id: 'out_for_delivery', label: 'Delivery', icon: Truck, status: 'out_for_delivery', acceptanceStatus: 'accepted' },
  { id: 'past', label: 'History', icon: CheckCircle2, status: 'delivered', acceptanceStatus: 'accepted' },
];

export default function Orders() {
  const [activeTab, setActiveTab] = useState('new');
  const [selectedOrderForDriver, setSelectedOrderForDriver] = useState(null);

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: async () => {
      const currentTab = TABS.find(t => t.id === activeTab);
      const params = { limit: 50 };
      if (activeTab === 'past') {
        params.status = 'delivered'; 
      } else {
        if (currentTab.status) params.status = currentTab.status;
        if (currentTab.acceptanceStatus) params.acceptanceStatus = currentTab.acceptanceStatus;
      }
      const endpoint = activeTab === 'new' ? '/orders/restaurant/new' : '/orders/restaurant';
      const { data } = await api.get(endpoint, { params });
      return data.data;
    },
    refetchInterval: activeTab === 'new' ? 15000 : false,
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark">Orders</h1>
        <button 
          onClick={() => refetch()}
          className={clsx(
            "p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-primary transition-all",
            isRefetching && "animate-spin text-primary"
          )}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-6 overflow-x-auto no-scrollbar flex shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-1 justify-center min-w-[100px]",
              activeTab === tab.id
                ? "bg-dark text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pb-20 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-scale-in">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <Inbox className="w-10 h-10 text-gray-300" />
            </div>
            <p className="font-medium">No orders in this stage</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order, index) => (
              <div key={order._id} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-up">
                <OrderCard 
                  order={order} 
                  activeTab={activeTab}
                  onAssignDriver={() => setSelectedOrderForDriver(order)}
                  refetch={refetch}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrderForDriver && (
        <AssignDriverModal 
          order={selectedOrderForDriver} 
          onClose={() => setSelectedOrderForDriver(null)}
          onSuccess={() => {
            setSelectedOrderForDriver(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}