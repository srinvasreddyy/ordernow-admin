// src/pages/dashboard/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Utensils, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const COLORS = ['#22C55E', '#FF5630', '#FFAB00', '#00B8D9']; // Green, Red, Yellow, Blue

export default function Dashboard() {
  // 1. Fetch Menu Item Performance
  const { data: menuPerformance, isLoading: menuLoading } = useQuery({
    queryKey: ['menuPerformance'],
    queryFn: async () => {
      const { data } = await api.get('/orders/restaurant/reports/menu-performance');
      return data.data;
    }
  });

  // 2. Fetch Order Reports
  const { data: ordersReport, isLoading: ordersLoading } = useQuery({
    queryKey: ['ordersReport'],
    queryFn: async () => {
      const { data } = await api.get('/orders/restaurant/reports/orders');
      return data.data;
    }
  });

  if (menuLoading || ordersLoading) return <div className="p-10 text-center animate-pulse text-secondary">Loading Dashboard...</div>;

  const { statusReport = [], orderTypeReport = [] } = ordersReport || {};

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
          <p className="text-secondary text-sm">Real-time overview of your operations.</p>
        </div>
        <Link to="/orders" className="btn-primary text-sm">Manage Orders</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Top Selling Items (Table) --- */}
        <div className="lg:col-span-2 card-base p-0 flex flex-col h-[450px]">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-lg text-dark flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" /> Top Performing Items
            </h3>
            <Link to="/menu" className="text-xs font-semibold text-primary hover:underline">View Menu</Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-secondary uppercase">Item Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-secondary uppercase text-right">Sold</th>
                  <th className="px-6 py-3 text-xs font-bold text-secondary uppercase text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {menuPerformance?.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-secondary">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-dark">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-secondary">{item.totalQuantitySold}</td>
                    <td className="px-6 py-4 text-right font-bold text-dark">£{item.totalRevenue.toFixed(2)}</td>
                  </tr>
                ))}
                {!menuPerformance?.length && (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-secondary">No sales data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Order Statistics (Charts) --- */}
        <div className="flex flex-col gap-6">
          
          {/* Order Status Donut Chart */}
          <div className="card-base p-6 flex flex-col h-[280px]">
            <h3 className="font-bold text-dark mb-2">Order Status Distribution</h3>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusReport}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {statusReport.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} 
                    formatter={(value) => [value, 'Orders']}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-2xl font-bold text-dark">{statusReport.reduce((a, b) => a + b.count, 0)}</span>
                <span className="block text-[10px] text-secondary uppercase font-bold">Total</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs text-secondary flex-wrap">
              {statusReport.map((entry, index) => (
                <div key={entry._id} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="capitalize">{entry._id.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Type Bar Chart */}
          <div className="card-base p-6 flex flex-col h-[280px]">
            <h3 className="font-bold text-dark mb-4">Order Types</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderTypeReport} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="_id" width={70} tick={{fontSize: 12, fill: '#637381', textTransform: 'capitalize'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#FF6D1F" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}