import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, ShoppingBag, CheckCircle, XCircle, 
  DollarSign, ArrowUpRight, ArrowDownRight, Plus 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const StatsCard = ({ title, value, subtext, icon: Icon, trend }) => (
  <div className="card-base p-6 hover:-translate-y-1 transition-transform duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-orange-50 text-primary">
        <Icon className="w-6 h-6" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-gray-500 text-xs font-semibold tracking-wider uppercase mb-1">{title}</p>
    <h3 className="text-2xl font-extrabold text-dark tracking-tight">{value}</h3>
    <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>
  </div>
);

export default function Dashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['restaurantStats'],
    queryFn: async () => {
      const { data } = await api.get('/orders/restaurant/stats');
      return data.data;
    },
    refetchInterval: 30000 
  });

  if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400 font-medium">Syncing Dashboard...</div>;

  const { overall, comparison, monthlyIncome } = statsData || {};
  const chartData = monthlyIncome?.map(item => ({ 
    name: `${item._id.month}/${item._id.year}`, 
    income: item.totalIncome 
  })) || [];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your business performance.</p>
        </div>
        <Link to="/orders" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Order
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={`£${overall?.totalIncome?.toFixed(2) || '0.00'}`} 
          subtext="Lifetime earnings"
          icon={DollarSign} 
        />
        <StatsCard 
          title="Monthly Revenue" 
          value={`£${comparison?.income?.current?.toFixed(2) || '0.00'}`} 
          trend={comparison?.income?.change}
          subtext="Vs last month"
          icon={TrendingUp} 
        />
        <StatsCard 
          title="Total Orders" 
          value={overall?.totalOrders || 0} 
          subtext="Lifetime orders"
          icon={ShoppingBag} 
        />
        <StatsCard 
          title="Active Month" 
          value={comparison?.orders?.current || 0} 
          trend={comparison?.orders?.change}
          subtext="Orders this month"
          icon={CheckCircle} 
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base p-6">
          <h3 className="text-lg font-bold text-dark mb-6">Revenue Analytics</h3>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `£${value}`} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#F9FAFB'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="income" fill="#FF6D1F" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No revenue data available.</div>
            )}
          </div>
        </div>

        <div className="card-base p-6 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-dark mb-6">Order Performance</h3>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /> Delivered</span>
                  <span className="text-xl font-bold text-dark">{overall?.totalDelivered || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(overall?.totalDelivered / overall?.totalOrders * 100) || 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-600"><XCircle className="w-4 h-4 text-red-500" /> Cancelled</span>
                  <span className="text-xl font-bold text-dark">{overall?.totalCancelled || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(overall?.totalCancelled / overall?.totalOrders * 100) || 0}%` }}></div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}