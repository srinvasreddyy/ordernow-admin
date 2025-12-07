import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ChefHat, Truck, CheckCircle2, AlertCircle, Inbox } from 'lucide-react';
import api from '../../api/axios';
import OrderCard from './components/OrderCard';
import AssignDriverModal from './components/AssignDriverModal';
import clsx from 'clsx';

const TABS = [
  { id: 'new', label: 'New Orders', icon: AlertCircle, status: 'placed', acceptanceStatus: 'pending' },
  { id: 'preparing', label: 'Preparing', icon: ChefHat, status: 'placed', acceptanceStatus: 'accepted' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, status: 'out_for_delivery', acceptanceStatus: 'accepted' },
  { id: 'past', label: 'Past Orders', icon: CheckCircle2, status: 'delivered', acceptanceStatus: 'accepted' },
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
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Live Orders</h1>
          <p className="text-secondary text-sm">Manage and track customer orders in real-time.</p>
        </div>
        <button 
          onClick={() => refetch()}
          className={clsx(
            "p-2.5 rounded-xl bg-white border border-gray-200 text-secondary hover:text-primary hover:border-primary/30 transition-all shadow-sm",
            isRefetching && "animate-spin text-primary"
          )}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-surface p-1.5 rounded-xl shadow-card border border-transparent flex shrink-0 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all whitespace-nowrap flex-1",
              activeTab === tab.id
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-secondary hover:bg-gray-50 hover:text-dark"
            )}
          >
            <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-white" : "text-gray-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pb-20 pr-1 -mr-2 scroll-smooth">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Fetching orders...</p>
          </div>
        ) : orders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-secondary animate-scale-in pb-20">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-dashed border-gray-200">
              <Inbox className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="font-semibold text-dark text-lg">No orders found</h3>
            <p className="text-sm">There are no orders in this stage right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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