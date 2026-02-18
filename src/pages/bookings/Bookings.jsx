import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, X, Unlock, Phone } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Bookings() {
  const queryClient = useQueryClient();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/bookings/restaurant', {
        params: { startDate, endDate }
      });
      return data.data;
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (id) => api.patch(`/bookings/restaurant/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Booking marked as completed");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Action failed")
  });

  // NEW: Mutation to forcefully release a pending lock
  const releaseLockMutation = useMutation({
    mutationFn: async (id) => api.patch(`/bookings/restaurant/${id}/expire`),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Slots released successfully");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Action failed")
  });

  const filteredBookings = bookings?.filter(b => statusFilter === 'all' || b.status === statusFilter) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-500 text-sm">View and manage table bookings</p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">From</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
          </div>
          <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">To</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
          </div>

          {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="mb-2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Clear Dates"
              >
                  <X size={16} />
              </button>
          )}

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
            <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white min-w-[140px]"
            >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled_by_user">User Cancelled</option>
                <option value="cancelled_by_owner">Owner Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-dashed">
          No bookings found.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Slots</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                  {/* Customer Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{booking.customerId?.fullName || 'Unknown'}</span>
                      <span className="text-xs text-gray-500 mb-0.5">{booking.customerId?.email}</span>
                      {booking.customerId?.phoneNumber && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone size={10} /> {booking.customerId.phoneNumber}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Table Info */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     <div className="font-medium text-gray-900">Table {booking.tableId?.tableNumber}</div>
                     <div className="text-xs flex items-center gap-1 mt-1"><Users size={12}/> {booking.guests} Guests</div>
                  </td>

                  {/* Date & Slots */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(booking.bookingDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {/* Display Start and End Time logic approx */}
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-700">
                            {booking.bookedSlots && booking.bookedSlots.length > 0 
                                ? `${booking.bookedSlots[0]} - ${booking.bookedSlots.length}hr` 
                                : 'N/A'}
                        </span>
                    </div>
                    {/* Tooltip or small text for specific slots */}
                    <div className="text-[10px] text-gray-400 mt-1 pl-6">
                        {booking.bookedSlots?.join(', ')}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      booking.status === 'confirmed' ? "bg-green-100 text-green-800" : 
                      booking.status === 'completed' ? "bg-blue-100 text-blue-800" : 
                      booking.status.includes('cancelled') ? "bg-red-100 text-red-800" : 
                      "bg-yellow-100 text-yellow-800"
                    )}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => { 
                             if(window.confirm('Mark this booking as completed?')) 
                             completeMutation.mutate(booking._id) 
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                        title="Mark as Completed"
                      >
                        <CheckCircle className="w-4 h-4" /> Complete
                      </button>
                    )}
                    {booking.status === 'pending' && (
                         <div className="flex flex-col items-end gap-1">
                            <span className="text-yellow-600 flex items-center gap-1 cursor-help" title="Payment pending">
                                <AlertCircle className="w-4 h-4" /> Awaiting Pay
                            </span>
                            <button
                                onClick={() => { 
                                     if(window.confirm('Force release this lock? The user will lose their reservation hold.')) 
                                     releaseLockMutation.mutate(booking._id) 
                                }}
                                className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 border border-red-200 px-2 py-0.5 rounded-md hover:bg-red-50 transition"
                            >
                                <Unlock className="w-3 h-3" /> Release Lock
                            </button>
                         </div>
                    )}
                    {booking.status === 'completed' && (
                        <span className="text-gray-400 flex items-center gap-1 justify-end">
                            <CheckCircle className="w-4 h-4" /> Done
                        </span>
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