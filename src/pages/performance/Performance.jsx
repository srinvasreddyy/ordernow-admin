// src/pages/performance/Performance.jsx
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Truck, Calendar } from 'lucide-react';
import api from '../../api/axios';
import clsx from 'clsx';

const StatCard = ({ title, value, subtext, icon: Icon, trend, color = "primary" }) => (
  <div className="card-base p-6 border-l-4" style={{ borderLeftColor: `var(--color-${color})` }}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-secondary text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-dark">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-2 text-sm">
        <span className={clsx(
          "font-bold px-2 py-0.5 rounded",
          trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-secondary">vs last month</span>
      </div>
    )}
    {subtext && <p className="text-xs text-secondary mt-2">{subtext}</p>}
  </div>
);

export default function Performance() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['restaurantStats'],
    queryFn: async () => {
      const { data } = await api.get('/orders/restaurant/stats');
      return data.data;
    }
  });

  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['salesReport'],
    queryFn: async () => {
      const { data } = await api.get('/orders/restaurant/reports/sales');
      return data.data;
    }
  });

  if (statsLoading || salesLoading) return <div className="p-10 text-center text-secondary animate-pulse">Loading Analytics...</div>;

  const { comparison, monthlyIncome } = statsData || {};
  const chartData = monthlyIncome?.map(item => ({
    name: `${item._id.month}/${item._id.year}`,
    revenue: item.totalIncome
  })) || [];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-bold text-dark">Performance Analytics</h1>
        <p className="text-secondary text-sm">Deep dive into your restaurant's financial health.</p>
      </div>

      {/* 1. Sales Report Overview (getRestaurantSalesReport) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Lifetime Revenue" 
          value={`£${salesReport?.totalRevenue?.toFixed(2) || '0.00'}`} 
          icon={DollarSign} 
          color="primary"
        />
        <StatCard 
          title="Total Orders Processed" 
          value={salesReport?.totalOrders || 0} 
          icon={ShoppingBag} 
          color="info"
        />
        <StatCard 
          title="Average Order Value" 
          value={`£${salesReport?.averageOrderValue?.toFixed(2) || '0.00'}`} 
          icon={TrendingUp} 
          color="success"
          subtext="Revenue per order on average"
        />
      </div>

      {/* 2. Monthly Trends (getRestaurantStats) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart */}
        <div className="lg:col-span-2 card-base p-6 flex flex-col h-[400px]">
          <h3 className="font-bold text-lg text-dark mb-6">Monthly Revenue Trend</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6D1F" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF6D1F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#637381', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val)=>`£${val}`} tick={{fill: '#637381', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`£${value.toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FF6D1F" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Monthly Comparisons */}
        <div className="space-y-6">
          <div className="card-base p-6">
            <h4 className="font-bold text-dark mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-secondary"/> This Month vs Last</h4>
            <div className="space-y-6">
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-secondary">Orders</span>
                  <span className={clsx("text-xs font-bold", comparison?.orders?.change >= 0 ? "text-green-600" : "text-red-600")}>
                    {comparison?.orders?.change > 0 ? '+' : ''}{comparison?.orders?.change}%
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-dark">{comparison?.orders?.current}</span>
                  <span className="text-xs text-gray-400 mb-1">prev: {comparison?.orders?.previous}</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min((comparison?.orders?.current / (comparison?.orders?.previous || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-secondary">Revenue</span>
                  <span className={clsx("text-xs font-bold", comparison?.income?.change >= 0 ? "text-green-600" : "text-red-600")}>
                    {comparison?.income?.change > 0 ? '+' : ''}{comparison?.income?.change}%
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-dark">£{comparison?.income?.current?.toFixed(0)}</span>
                  <span className="text-xs text-gray-400 mb-1">prev: £{comparison?.income?.previous?.toFixed(0)}</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min((comparison?.income?.current / (comparison?.income?.previous || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-secondary">Delivered</span>
                  <span className={clsx("text-xs font-bold", comparison?.delivered?.change >= 0 ? "text-green-600" : "text-red-600")}>
                    {comparison?.delivered?.change > 0 ? '+' : ''}{comparison?.delivered?.change}%
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-dark">{comparison?.delivered?.current}</span>
                  <span className="text-xs text-gray-400 mb-1">prev: {comparison?.delivered?.previous}</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${Math.min((comparison?.delivered?.current / (comparison?.delivered?.previous || 1)) * 100, 100)}%` }} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}