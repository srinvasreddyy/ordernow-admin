import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Users, XCircle, Search } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Bookings() {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', dateFilter],
    queryFn: async () => {
      const { data } = await api.get('/bookings/restaurant', {
        params: { date: dateFilter }
      });
      return data.data;
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => api.patch(`/bookings/restaurant/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Booking cancelled and refunded");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Cancel failed")
  });

  const filteredBookings = bookings?.filter(b => statusFilter === 'all' || b.status === statusFilter) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-500 text-sm">View and manage table bookings</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled_by_user">User Cancelled</option>
            <option value="cancelled_by_owner">Owner Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-dashed">
          No bookings found for this date.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{booking.customerId?.fullName || 'Unknown'}</span>
                      <span className="text-xs text-gray-500">{booking.customerId?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Table {booking.tableId?.tableNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(booking.bookingDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(booking.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {booking.guests}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      booking.status === 'confirmed' ? "bg-green-100 text-green-800" : 
                      booking.status.includes('cancelled') ? "bg-red-100 text-red-800" : 
                      "bg-gray-100 text-gray-800"
                    )}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => { if(window.confirm('Cancel this booking and refund the fee?')) cancelMutation.mutate(booking._id) }}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-auto"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}