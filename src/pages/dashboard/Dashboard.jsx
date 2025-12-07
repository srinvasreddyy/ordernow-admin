import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, ShoppingBag, CheckCircle, XCircle, 
  DollarSign, ArrowUpRight, ArrowDownRight, Plus, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const StatsCard = ({ title, value, subtext, icon: Icon, trend }) => (
  <div className="card-base p-6 hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h6 className="text-secondary text-sm font-semibold mb-1">{title}</h6>
        <h3 className="text-2xl font-bold text-dark">{value}</h3>
      </div>
      <div className="p-3 rounded-full bg-orange-50 text-primary">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      {trend !== undefined && (
        <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
      <p className="text-xs text-secondary font-medium">{subtext}</p>
    </div>
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

  if (isLoading) return <div className="p-10 text-center animate-pulse text-secondary">Loading Dashboard...</div>;

  const { overall, comparison, monthlyIncome } = statsData || {};
  const chartData = monthlyIncome?.map(item => ({ 
    name: `${item._id.month}/${item._id.year}`, 
    income: item.totalIncome 
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-dark">Hi, Welcome back!</h1>
          <p className="text-secondary text-sm mt-1">Here's what's happening with your restaurant today.</p>
        </div>
        <Link to="/orders" className="btn-primary">
          <Plus className="w-4 h-4" /> New Order
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
          subtext="vs last month"
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
          icon={Calendar} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base flex flex-col h-[420px]">
          <div className="card-header">
            <h3 className="font-bold text-lg text-dark">Revenue Analytics</h3>
          </div>
          <div className="flex-1 p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#637381', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `£${value}`} tick={{fill: '#637381', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="income" fill="#FF6D1F" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base h-[420px] flex flex-col">
          <div className="card-header">
            <h3 className="font-bold text-lg text-dark">Order Status</h3>
          </div>
          <div className="p-6 flex flex-col justify-center gap-8 flex-1">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="flex items-center gap-2 text-sm font-medium text-dark"><CheckCircle className="w-4 h-4 text-green-500" /> Delivered</span>
                <span className="text-lg font-bold text-dark">{overall?.totalDelivered || 0}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: `${(overall?.totalDelivered / overall?.totalOrders * 100) || 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="flex items-center gap-2 text-sm font-medium text-dark"><XCircle className="w-4 h-4 text-red-500" /> Cancelled</span>
                <span className="text-lg font-bold text-dark">{overall?.totalCancelled || 0}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${(overall?.totalCancelled / overall?.totalOrders * 100) || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}