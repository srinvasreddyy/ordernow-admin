import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit2, Armchair, Power, Users, Calendar, Clock, DollarSign } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Tables() {
  const queryClient = useQueryClient();
  const [editingTable, setEditingTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Tables
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await api.get('/tables');
      return data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data) => editingTable ? api.put(`/tables/${editingTable._id}`, data) : api.post('/tables', data),
    onSuccess: () => { queryClient.invalidateQueries(['tables']); toast.success("Saved!"); closeModal(); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tables/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['tables']); toast.success("Deleted"); }
  });

  const { register, handleSubmit, reset } = useForm();

  // Get today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const openModal = (table = null) => {
    setEditingTable(table);
    reset(table ? { 
      tableNumber: table.tableNumber, 
      capacity: table.capacity, 
      area: table.area,
      bookingPrice: table.bookingPrice,
      maxBookingHours: table.maxBookingHours,
      // Date/Time are usually fixed once created, but allowing view
      date: table.date ? new Date(table.date).toISOString().split('T')[0] : todayStr
    } : { 
      tableNumber: '', 
      capacity: 4, 
      area: 'General', 
      date: todayStr,
      startTime: '10:00',
      endTime: '22:00',
      bookingPrice: 10,
      maxBookingHours: 2
    });
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingTable(null); reset(); };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark">Table Inventory</h1>
          <p className="text-secondary text-sm">Manage daily table availability.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Daily Table
        </button>
      </div>

      {isLoading ? <div className="text-center py-10">Loading...</div> : !tables?.length ? (
        <div className="card-base p-16 text-center text-secondary border-dashed">No tables scheduled for the future.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div key={table._id} className="card-base p-0 relative group hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100">
              {/* Header with Date */}
              <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(table.date).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(table)} className="p-1.5 hover:bg-white rounded text-blue-600 shadow-sm"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => { if(window.confirm('Delete?')) deleteMutation.mutate(table._id) }} className="p-1.5 hover:bg-white rounded text-red-600 shadow-sm"><Trash2 className="w-3 h-3" /></button>
                  </div>
              </div>

              <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-dark">Table {table.tableNumber}</h3>
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Armchair className="w-5 h-5" /></div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-secondary mb-4">
                      <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400"/> {table.capacity} Seats • <span className="uppercase text-xs font-bold bg-gray-100 px-1.5 rounded">{table.area}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400"/> 
                          £{table.bookingPrice} Booking Fee
                      </div>
                      <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400"/> 
                          Max {table.maxBookingHours}h / Session
                      </div>
                  </div>

                  {/* Slot Preview */}
                  <div className="flex flex-wrap gap-1">
                      {table.availableHours.slice(0, 4).map(h => (
                          <span key={h} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{h}</span>
                      ))}
                      {table.availableHours.length > 4 && <span className="text-[10px] text-gray-400">+ more</span>}
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-scale-in">
            <h2 className="text-xl font-bold mb-6">{editingTable ? 'Edit Table Configuration' : 'Add New Table Slot'}</h2>
            
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="input-label">Date</label><input type="date" {...register('date', { required: true })} className="input-field" min={todayStr} disabled={!!editingTable} /></div>
                 <div><label className="input-label">Table Number</label><input {...register('tableNumber', { required: true })} className="input-field" placeholder="e.g. T-01" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div><label className="input-label">Capacity</label><input type="number" {...register('capacity', { required: true, min: 1 })} className="input-field" /></div>
                 <div><label className="input-label">Area</label><input {...register('area')} className="input-field" placeholder="e.g. Patio" /></div>
              </div>

              {!editingTable && (
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div><label className="input-label">Start Time</label><input type="time" {...register('startTime', { required: true })} className="input-field" step="3600" /></div>
                    <div><label className="input-label">End Time</label><input type="time" {...register('endTime', { required: true })} className="input-field" step="3600" /></div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="input-label">Booking Fee (£)</label>
                    <input type="number" step="0.01" {...register('bookingPrice', { required: true, min: 0 })} className="input-field" />
                    <p className="text-[10px] text-gray-400 mt-1">Flat cost per booking.</p>
                 </div>
                 <div>
                    <label className="input-label">Max Hours</label>
                    <input type="number" {...register('maxBookingHours', { required: true, min: 1 })} className="input-field" />
                    <p className="text-[10px] text-gray-400 mt-1">Limit per customer.</p>
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}